const pool = require('../config/db');

// GET /api/residents?search=&room=&disease=&bloodGroup=&gender=&admissionDate=&status=
async function getResidents(req, res) {
  const { search, room, disease, bloodGroup, gender, admissionDate, status } = req.query;

  let query = `
    SELECT DISTINCT r.* FROM residents r
    LEFT JOIN medical_records m ON m.resident_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND r.full_name ILIKE $${params.length}`;
  }
  if (room) {
    params.push(`%${room}%`);
    query += ` AND r.room_number ILIKE $${params.length}`;
  }
  if (disease) {
    params.push(`%${disease}%`);
    query += ` AND m.current_diseases ILIKE $${params.length}`;
  }
  if (bloodGroup) {
    params.push(bloodGroup);
    query += ` AND r.blood_group = $${params.length}`;
  }
  if (gender) {
    params.push(gender);
    query += ` AND r.gender = $${params.length}`;
  }
  if (admissionDate) {
    params.push(admissionDate);
    query += ` AND r.date_of_admission = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND r.status = $${params.length}`;
  }

  query += ' ORDER BY r.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching residents.' });
  }
}

// GET /api/residents/:id
async function getResidentById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM residents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resident not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching resident.' });
  }
}

// POST /api/residents
async function createResident(req, res) {
  const {
    full_name, age, gender, profile_photo, contact_number, emergency_contact,
    address, blood_group, date_of_admission, room_number, aadhaar_id,
    marital_status, guardian_info, occupation, status,
  } = req.body;

  if (!full_name || !age) {
    return res.status(400).json({ error: 'full_name and age are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO residents
       (full_name, age, gender, profile_photo, contact_number, emergency_contact, address,
        blood_group, date_of_admission, room_number, aadhaar_id, marital_status,
        guardian_info, occupation, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9, CURRENT_DATE),$10,$11,$12,$13,$14,COALESCE($15,'Active'))
       RETURNING *`,
      [full_name, age, gender, profile_photo, contact_number, emergency_contact, address,
       blood_group, date_of_admission, room_number, aadhaar_id, marital_status,
       guardian_info, occupation, status]
    );

    // Mark room as occupied if it exists in rooms table
    if (room_number) {
      await pool.query(
        `INSERT INTO rooms (room_number, is_occupied) VALUES ($1, TRUE)
         ON CONFLICT (room_number) DO UPDATE SET is_occupied = TRUE`,
        [room_number]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating resident.' });
  }
}

// PUT /api/residents/:id
async function updateResident(req, res) {
  const fields = [
    'full_name', 'age', 'gender', 'profile_photo', 'contact_number', 'emergency_contact',
    'address', 'blood_group', 'date_of_admission', 'room_number', 'aadhaar_id',
    'marital_status', 'guardian_info', 'occupation', 'status',
  ];

  const updates = [];
  const values = [];
  let idx = 1;

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${idx}`);
      values.push(req.body[field]);
      idx++;
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update.' });
  }

  updates.push(`updated_at = NOW()`);
  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE residents SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resident not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating resident.' });
  }
}

// DELETE /api/residents/:id
async function deleteResident(req, res) {
  try {
    const result = await pool.query('DELETE FROM residents WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resident not found.' });
    res.json({ message: 'Resident deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting resident.' });
  }
}

// POST /api/residents/:id/photo  (multipart upload, field name "photo")
async function uploadPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded.' });

  const photoPath = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(
      'UPDATE residents SET profile_photo = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [photoPath, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resident not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving photo.' });
  }
}

module.exports = { getResidents, getResidentById, createResident, updateResident, deleteResident, uploadPhoto };