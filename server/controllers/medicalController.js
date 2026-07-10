const pool = require('../config/db');

// GET /api/residents/:residentId/medical
async function getMedicalRecord(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM medical_records WHERE resident_id = $1',
      [req.params.residentId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching medical record.' });
  }
}

// PUT /api/residents/:residentId/medical  (upsert)
async function upsertMedicalRecord(req, res) {
  const residentId = req.params.residentId;
  const {
    medical_history, current_diseases, allergies, chronic_illnesses,
    current_medications, doctor_name, doctor_contact, hospital_name,
    vaccination_records, surgical_history,
  } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM medical_records WHERE resident_id = $1', [residentId]);

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE medical_records SET
          medical_history=$1, current_diseases=$2, allergies=$3, chronic_illnesses=$4,
          current_medications=$5, doctor_name=$6, doctor_contact=$7, hospital_name=$8,
          vaccination_records=$9, surgical_history=$10, updated_at=NOW()
         WHERE resident_id=$11 RETURNING *`,
        [medical_history, current_diseases, allergies, chronic_illnesses, current_medications,
         doctor_name, doctor_contact, hospital_name, vaccination_records, surgical_history, residentId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO medical_records
         (resident_id, medical_history, current_diseases, allergies, chronic_illnesses,
          current_medications, doctor_name, doctor_contact, hospital_name,
          vaccination_records, surgical_history)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [residentId, medical_history, current_diseases, allergies, chronic_illnesses,
         current_medications, doctor_name, doctor_contact, hospital_name,
         vaccination_records, surgical_history]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving medical record.' });
  }
}

// GET /api/residents/:residentId/hospital-visits
async function getHospitalVisits(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM hospital_visits WHERE resident_id = $1 ORDER BY visit_date DESC',
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching hospital visits.' });
  }
}

// POST /api/residents/:residentId/hospital-visits
async function addHospitalVisit(req, res) {
  const { visit_date, reason, hospital_name, doctor_name, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO hospital_visits (resident_id, visit_date, reason, hospital_name, doctor_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.residentId, visit_date, reason, hospital_name, doctor_name, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error adding hospital visit.' });
  }
}

// GET /api/residents/:residentId/documents
async function getDocuments(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM medical_documents WHERE resident_id = $1 ORDER BY uploaded_at DESC',
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching documents.' });
  }
}

// POST /api/residents/:residentId/documents  (metadata; actual file handled by multer upload route)
async function addDocument(req, res) {
  const { doc_type, file_name, file_path } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO medical_documents (resident_id, doc_type, file_name, file_path)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.residentId, doc_type, file_name, file_path]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error saving document.' });
  }
}

module.exports = {
  getMedicalRecord, upsertMedicalRecord, getHospitalVisits, addHospitalVisit,
  getDocuments, addDocument,
};
