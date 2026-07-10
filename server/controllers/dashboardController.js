const pool = require('../config/db');

// GET /api/dashboard/summary
async function getSummary(req, res) {
  try {
    const [
      totalResidents, activeResidents, genderStats, totalStaff,
      medicineReminders, todaysCheckups, upcomingAppointments,
      rooms, monthlyAdmissions,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM residents'),
      pool.query(`SELECT COUNT(*) FROM residents WHERE status = 'Active'`),
      pool.query(`SELECT gender, COUNT(*) FROM residents GROUP BY gender`),
      pool.query('SELECT COUNT(*) FROM staff WHERE is_active = TRUE'),
      pool.query(`
        SELECT COUNT(*) FROM medicines m
        WHERE m.is_active = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM medicine_logs l
            WHERE l.medicine_id = m.id AND l.log_date = CURRENT_DATE AND l.status = 'Taken'
          )
      `),
      pool.query(`SELECT COUNT(*) FROM health_records WHERE record_date = CURRENT_DATE`),
      pool.query(`
        SELECT COUNT(*) FROM appointments
        WHERE status = 'Scheduled' AND appointment_date >= CURRENT_DATE
      `),
      pool.query(`SELECT COUNT(*) FILTER (WHERE is_occupied) AS occupied, COUNT(*) FILTER (WHERE NOT is_occupied) AS vacant FROM rooms`),
      pool.query(`
        SELECT TO_CHAR(date_of_admission, 'YYYY-MM') AS month, COUNT(*) AS count
        FROM residents
        WHERE date_of_admission >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY month ORDER BY month
      `),
    ]);

    const genderMap = {};
    genderStats.rows.forEach((row) => { genderMap[row.gender || 'Unspecified'] = parseInt(row.count); });

    res.json({
      total_residents: parseInt(totalResidents.rows[0].count),
      active_residents: parseInt(activeResidents.rows[0].count),
      gender_stats: genderMap,
      total_staff: parseInt(totalStaff.rows[0].count),
      pending_medicine_reminders: parseInt(medicineReminders.rows[0].count),
      todays_checkups: parseInt(todaysCheckups.rows[0].count),
      upcoming_appointments: parseInt(upcomingAppointments.rows[0].count),
      rooms: {
        occupied: parseInt(rooms.rows[0].occupied || 0),
        vacant: parseInt(rooms.rows[0].vacant || 0),
      },
      monthly_admissions: monthlyAdmissions.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error building dashboard summary.' });
  }
}

// GET /api/dashboard/emergency-alerts
async function getEmergencyAlerts(req, res) {
  try {
    const result = await pool.query(
      `SELECT n.*, r.full_name, r.room_number FROM notifications n
       LEFT JOIN residents r ON r.id = n.resident_id
       WHERE n.type = 'emergency'
       ORDER BY n.created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching emergency alerts.' });
  }
}

module.exports = { getSummary, getEmergencyAlerts };
