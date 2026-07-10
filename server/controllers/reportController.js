const pool = require('../config/db');

// GET /api/reports/residents  -> full resident report (CSV-ready JSON)
async function residentReport(req, res) {
  try {
    const result = await pool.query(`
      SELECT r.id, r.full_name, r.age, r.gender, r.room_number, r.blood_group,
             r.status, r.date_of_admission, m.current_diseases, m.allergies
      FROM residents r
      LEFT JOIN medical_records m ON m.resident_id = r.id
      ORDER BY r.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating resident report.' });
  }
}

// GET /api/reports/health-trends/:residentId
async function healthTrends(req, res) {
  try {
    const result = await pool.query(
      `SELECT record_date, blood_pressure, blood_sugar, body_temperature, pulse_rate, spo2, weight, bmi
       FROM health_records WHERE resident_id = $1 ORDER BY record_date ASC`,
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching health trends.' });
  }
}

// GET /api/reports/medicine-usage
async function medicineUsageReport(req, res) {
  try {
    const result = await pool.query(`
      SELECT m.medicine_name, r.full_name, r.room_number,
             COUNT(*) FILTER (WHERE l.status = 'Taken') AS taken_count,
             COUNT(*) FILTER (WHERE l.status = 'Missed') AS missed_count
      FROM medicines m
      JOIN residents r ON r.id = m.resident_id
      LEFT JOIN medicine_logs l ON l.medicine_id = m.id
      GROUP BY m.id, m.medicine_name, r.full_name, r.room_number
      ORDER BY r.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating medicine usage report.' });
  }
}

// GET /api/reports/appointments
async function appointmentReport(req, res) {
  try {
    const result = await pool.query(`
      SELECT a.*, r.full_name, r.room_number
      FROM appointments a
      JOIN residents r ON r.id = a.resident_id
      ORDER BY a.appointment_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating appointment report.' });
  }
}

// GET /api/reports/staff-performance
async function staffPerformanceReport(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.id, s.full_name, s.designation,
             COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'Completed') AS tasks_completed,
             COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'Present') AS days_present,
             COUNT(DISTINCT a.id) AS total_days_logged
      FROM staff s
      LEFT JOIN staff_tasks t ON t.staff_id = s.id
      LEFT JOIN staff_attendance a ON a.staff_id = s.id
      GROUP BY s.id, s.full_name, s.designation
      ORDER BY s.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating staff performance report.' });
  }
}

// GET /api/reports/financial?from=&to=
async function financialReport(req, res) {
  const { from, to } = req.query;
  try {
    const result = await pool.query(
      `SELECT record_type, category, SUM(amount) AS total, COUNT(*) AS entries
       FROM financial_records
       WHERE ($1::date IS NULL OR record_date >= $1)
         AND ($2::date IS NULL OR record_date <= $2)
       GROUP BY record_type, category
       ORDER BY record_type, total DESC`,
      [from || null, to || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating financial report.' });
  }
}

// GET /api/reports/growth-stats  (resident growth over time)
async function residentGrowthStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date_of_admission, 'YYYY-MM') AS month, COUNT(*) AS admissions
      FROM residents
      GROUP BY month ORDER BY month
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching growth statistics.' });
  }
}

// GET /api/reports/monthly-summary?year=&month=
async function monthlySummary(req, res) {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;

  try {
    const [newAdmissions, checkups, missedMeds, appointments] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM residents WHERE EXTRACT(YEAR FROM date_of_admission)=$1 AND EXTRACT(MONTH FROM date_of_admission)=$2`,
        [year, month]
      ),
      pool.query(
        `SELECT COUNT(*) FROM health_records WHERE EXTRACT(YEAR FROM record_date)=$1 AND EXTRACT(MONTH FROM record_date)=$2`,
        [year, month]
      ),
      pool.query(
        `SELECT COUNT(*) FROM medicine_logs WHERE status='Missed' AND EXTRACT(YEAR FROM log_date)=$1 AND EXTRACT(MONTH FROM log_date)=$2`,
        [year, month]
      ),
      pool.query(
        `SELECT COUNT(*) FROM appointments WHERE EXTRACT(YEAR FROM appointment_date)=$1 AND EXTRACT(MONTH FROM appointment_date)=$2`,
        [year, month]
      ),
    ]);

    res.json({
      year, month,
      new_admissions: parseInt(newAdmissions.rows[0].count),
      total_checkups: parseInt(checkups.rows[0].count),
      missed_medicines: parseInt(missedMeds.rows[0].count),
      appointments: parseInt(appointments.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error generating monthly summary.' });
  }
}

module.exports = {
  residentReport, healthTrends, medicineUsageReport, appointmentReport,
  staffPerformanceReport, financialReport, residentGrowthStats, monthlySummary,
};
