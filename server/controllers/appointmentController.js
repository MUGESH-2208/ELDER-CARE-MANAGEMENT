const pool = require('../config/db');

async function getAppointments(req, res) {
  try {
    const result = await pool.query(`
      SELECT a.*, r.full_name, r.room_number FROM appointments a
      JOIN residents r ON r.id = a.resident_id
      ORDER BY a.appointment_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching appointments.' });
  }
}

async function createAppointment(req, res) {
  const { resident_id, doctor_name, appointment_date, appointment_time, purpose } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO appointments (resident_id, doctor_name, appointment_date, appointment_time, purpose)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [resident_id, doctor_name, appointment_date, appointment_time, purpose]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating appointment.' });
  }
}

async function updateAppointment(req, res) {
  const { status, appointment_date, appointment_time, doctor_name, purpose } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointments SET
        status = COALESCE($1, status),
        appointment_date = COALESCE($2, appointment_date),
        appointment_time = COALESCE($3, appointment_time),
        doctor_name = COALESCE($4, doctor_name),
        purpose = COALESCE($5, purpose)
       WHERE id = $6 RETURNING *`,
      [status, appointment_date, appointment_time, doctor_name, purpose, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating appointment.' });
  }
}

async function deleteAppointment(req, res) {
  try {
    await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Appointment deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting appointment.' });
  }
}

module.exports = { getAppointments, createAppointment, updateAppointment, deleteAppointment };
