const pool = require('../config/db');

// GET /api/staff
async function getAllStaff(req, res) {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching staff.' });
  }
}

// POST /api/staff
async function createStaff(req, res) {
  const { full_name, designation, contact_number, email, address, date_joined, user_id } = req.body;
  if (!full_name) return res.status(400).json({ error: 'full_name is required.' });

  try {
    const result = await pool.query(
      `INSERT INTO staff (user_id, full_name, designation, contact_number, email, address, date_joined)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, CURRENT_DATE)) RETURNING *`,
      [user_id, full_name, designation, contact_number, email, address, date_joined]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating staff member.' });
  }
}

// PUT /api/staff/:id
async function updateStaff(req, res) {
  const fields = ['full_name', 'designation', 'contact_number', 'email', 'address', 'is_active'];
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
    const result = await pool.query(`UPDATE staff SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Staff not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating staff.' });
  }
}

// DELETE /api/staff/:id
async function deleteStaff(req, res) {
  try {
    await pool.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
    res.json({ message: 'Staff member deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting staff.' });
  }
}

// --- Attendance ---
// POST /api/staff/:id/attendance  { status, attendance_date }
async function markAttendance(req, res) {
  const { status, attendance_date } = req.body;
  const date = attendance_date || new Date().toISOString().slice(0, 10);
  try {
    const result = await pool.query(
      `INSERT INTO staff_attendance (staff_id, attendance_date, status)
       VALUES ($1,$2,$3)
       ON CONFLICT (staff_id, attendance_date) DO UPDATE SET status = $3
       RETURNING *`,
      [req.params.id, date, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error marking attendance.' });
  }
}

// GET /api/staff/:id/attendance?from=&to=
async function getAttendance(req, res) {
  const { from, to } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM staff_attendance WHERE staff_id = $1
       AND ($2::date IS NULL OR attendance_date >= $2)
       AND ($3::date IS NULL OR attendance_date <= $3)
       ORDER BY attendance_date DESC`,
      [req.params.id, from || null, to || null]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching attendance.' });
  }
}

// --- Shifts ---
async function assignShift(req, res) {
  const { shift_date, shift_type, start_time, end_time } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO staff_shifts (staff_id, shift_date, shift_type, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, shift_date, shift_type, start_time, end_time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error assigning shift.' });
  }
}

async function getShifts(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM staff_shifts WHERE staff_id = $1 ORDER BY shift_date DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching shifts.' });
  }
}

// --- Leaves ---
async function requestLeave(req, res) {
  const { from_date, to_date, reason } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO staff_leaves (staff_id, from_date, to_date, reason) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, from_date, to_date, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error requesting leave.' });
  }
}

async function updateLeaveStatus(req, res) {
  const { status } = req.body; // Approved / Rejected
  try {
    const result = await pool.query(
      'UPDATE staff_leaves SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.leaveId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating leave status.' });
  }
}

// --- Tasks ---
async function assignTask(req, res) {
  const { resident_id, task_description, due_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO staff_tasks (staff_id, resident_id, task_description, due_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, resident_id, task_description, due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error assigning task.' });
  }
}

async function getTasks(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM staff_tasks WHERE staff_id = $1 ORDER BY due_date ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching tasks.' });
  }
}

async function updateTaskStatus(req, res) {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE staff_tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.taskId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating task.' });
  }
}

// --- Care Notes ---
async function addCareNote(req, res) {
  const { resident_id, note, note_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO staff_care_notes (staff_id, resident_id, note, note_date)
       VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE)) RETURNING *`,
      [req.params.id, resident_id, note, note_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error adding care note.' });
  }
}

// --- Activity Logs ---
async function getActivityLogs(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM staff_activity_logs WHERE staff_id = $1 ORDER BY logged_at DESC LIMIT 100',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching activity logs.' });
  }
}

// --- Performance (basic aggregate) ---
async function getPerformance(req, res) {
  try {
    const tasksDone = await pool.query(
      `SELECT COUNT(*) FROM staff_tasks WHERE staff_id = $1 AND status = 'Completed'`,
      [req.params.id]
    );
    const attendanceRate = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Present') AS present_days,
         COUNT(*) AS total_days
       FROM staff_attendance WHERE staff_id = $1`,
      [req.params.id]
    );
    res.json({
      tasks_completed: parseInt(tasksDone.rows[0].count),
      attendance: attendanceRate.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error computing performance.' });
  }
}

module.exports = {
  getAllStaff, createStaff, updateStaff, deleteStaff,
  markAttendance, getAttendance, assignShift, getShifts,
  requestLeave, updateLeaveStatus, assignTask, getTasks, updateTaskStatus,
  addCareNote, getActivityLogs, getPerformance,
};
