const pool = require('../config/db');

function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(2);
}

// GET /api/residents/:residentId/health?from=&to=
async function getHealthRecords(req, res) {
  const { from, to } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM health_records
       WHERE resident_id = $1
         AND ($2::date IS NULL OR record_date >= $2)
         AND ($3::date IS NULL OR record_date <= $3)
       ORDER BY record_date DESC`,
      [req.params.residentId, from || null, to || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching health records.' });
  }
}

// POST /api/residents/:residentId/health
async function addHealthRecord(req, res) {
  const {
    record_date, blood_pressure, blood_sugar, body_temperature,
    pulse_rate, spo2, weight, height, notes,
  } = req.body;

  const bmi = calculateBMI(weight, height);

  try {
    const result = await pool.query(
      `INSERT INTO health_records
       (resident_id, record_date, blood_pressure, blood_sugar, body_temperature,
        pulse_rate, spo2, weight, height, bmi, notes, recorded_by)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.params.residentId, record_date, blood_pressure, blood_sugar, body_temperature,
       pulse_rate, spo2, weight, height, bmi, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding health record.' });
  }
}

// GET /api/residents/:residentId/health/monthly-report?year=&month=
async function getMonthlyReport(req, res) {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || new Date().getMonth() + 1;

  try {
    const result = await pool.query(
      `SELECT * FROM health_records
       WHERE resident_id = $1
         AND EXTRACT(YEAR FROM record_date) = $2
         AND EXTRACT(MONTH FROM record_date) = $3
       ORDER BY record_date ASC`,
      [req.params.residentId, year, month]
    );

    const rows = result.rows;
    const avg = (key) => {
      const vals = rows.map((r) => parseFloat(r[key])).filter((v) => !isNaN(v));
      if (vals.length === 0) return null;
      return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    };

    res.json({
      resident_id: req.params.residentId,
      year, month,
      total_checkups: rows.length,
      averages: {
        blood_sugar: avg('blood_sugar'),
        body_temperature: avg('body_temperature'),
        pulse_rate: avg('pulse_rate'),
        spo2: avg('spo2'),
        weight: avg('weight'),
        bmi: avg('bmi'),
      },
      records: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating monthly report.' });
  }
}

// GET /api/health/todays-checkups  (dashboard support)
async function getTodaysCheckups(req, res) {
  try {
    const result = await pool.query(
      `SELECT h.*, r.full_name, r.room_number FROM health_records h
       JOIN residents r ON r.id = h.resident_id
       WHERE h.record_date = CURRENT_DATE
       ORDER BY h.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching today\'s checkups.' });
  }
}

module.exports = { getHealthRecords, addHealthRecord, getMonthlyReport, getTodaysCheckups };
