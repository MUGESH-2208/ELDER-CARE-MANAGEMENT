const pool = require('../config/db');

// GET /api/residents/:residentId/medicines
async function getMedicines(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM medicines WHERE resident_id = $1 ORDER BY is_active DESC, created_at DESC',
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching medicines.' });
  }
}

// POST /api/residents/:residentId/medicines
async function addMedicine(req, res) {
  const { medicine_name, dosage, frequency, time_schedule, start_date, end_date, stock_available } = req.body;
  if (!medicine_name || !start_date) {
    return res.status(400).json({ error: 'medicine_name and start_date are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO medicines (resident_id, medicine_name, dosage, frequency, time_schedule, start_date, end_date, stock_available)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,0)) RETURNING *`,
      [req.params.residentId, medicine_name, dosage, frequency, time_schedule, start_date, end_date, stock_available]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding medicine.' });
  }
}

// PUT /api/medicines/:id
async function updateMedicine(req, res) {
  const fields = ['medicine_name', 'dosage', 'frequency', 'time_schedule', 'start_date', 'end_date', 'stock_available', 'is_active'];
  const updates = [];
  const values = [];
  let idx = 1;

  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx}`);
      values.push(req.body[f]);
      idx++;
    }
  });

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE medicines SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medicine not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating medicine.' });
  }
}

// DELETE /api/medicines/:id
async function deleteMedicine(req, res) {
  try {
    await pool.query('DELETE FROM medicines WHERE id = $1', [req.params.id]);
    res.json({ message: 'Medicine deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting medicine.' });
  }
}

// GET /api/residents/:residentId/medicines/logs?date=YYYY-MM-DD
// Daily medicine status across all active medicines for a resident
async function getDailyLogs(req, res) {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  try {
    const result = await pool.query(
      `SELECT m.id AS medicine_id, m.medicine_name, m.dosage, m.time_schedule,
              COALESCE(l.status, 'Pending') AS status, l.log_date
       FROM medicines m
       LEFT JOIN medicine_logs l ON l.medicine_id = m.id AND l.log_date = $2
       WHERE m.resident_id = $1 AND m.is_active = TRUE
       ORDER BY m.time_schedule`,
      [req.params.residentId, date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching daily medicine logs.' });
  }
}

// POST /api/medicines/:id/log  { status: 'Taken' | 'Missed', log_date }
async function markMedicineStatus(req, res) {
  const { status, log_date } = req.body;
  const date = log_date || new Date().toISOString().slice(0, 10);

  if (!['Taken', 'Missed', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'status must be Taken, Missed, or Pending.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO medicine_logs (medicine_id, log_date, status, marked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (medicine_id, log_date)
       DO UPDATE SET status = $3, marked_by = $4, marked_at = NOW()
       RETURNING *`,
      [req.params.id, date, status, req.user.id]
    );

    // Decrement stock when marked as Taken
    if (status === 'Taken') {
      await pool.query(
        'UPDATE medicines SET stock_available = GREATEST(stock_available - 1, 0) WHERE id = $1',
        [req.params.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating medicine status.' });
  }
}

// GET /api/medicines/missed-report?from=&to=
async function getMissedReport(req, res) {
  const { from, to } = req.query;
  try {
    const result = await pool.query(
      `SELECT r.full_name, r.room_number, m.medicine_name, l.log_date, l.status
       FROM medicine_logs l
       JOIN medicines m ON m.id = l.medicine_id
       JOIN residents r ON r.id = m.resident_id
       WHERE l.status = 'Missed'
         AND ($1::date IS NULL OR l.log_date >= $1)
         AND ($2::date IS NULL OR l.log_date <= $2)
       ORDER BY l.log_date DESC`,
      [from || null, to || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error generating missed medicine report.' });
  }
}

// GET /api/medicines/low-stock  (stock below threshold, for reminders)
async function getLowStock(req, res) {
  const threshold = parseInt(req.query.threshold) || 5;
  try {
    const result = await pool.query(
      `SELECT m.*, r.full_name, r.room_number FROM medicines m
       JOIN residents r ON r.id = m.resident_id
       WHERE m.is_active = TRUE AND m.stock_available <= $1
       ORDER BY m.stock_available ASC`,
      [threshold]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching low stock medicines.' });
  }
}

module.exports = {
  getMedicines, addMedicine, updateMedicine, deleteMedicine,
  getDailyLogs, markMedicineStatus, getMissedReport, getLowStock,
};
