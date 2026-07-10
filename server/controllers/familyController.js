const pool = require('../config/db');

// GET /api/family/my-residents  (residents linked to logged-in family user)
async function getMyResidents(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.*, fl.relationship FROM residents r
       JOIN family_links fl ON fl.resident_id = r.id
       WHERE fl.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching linked residents.' });
  }
}

// POST /api/family/link  (admin links a family user account to a resident)
async function linkFamilyMember(req, res) {
  const { user_id, resident_id, relationship } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO family_links (user_id, resident_id, relationship) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, resident_id) DO UPDATE SET relationship = $3
       RETURNING *`,
      [user_id, resident_id, relationship]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error linking family member.' });
  }
}

// GET /api/family/residents/:residentId/progress  (health + medicine summary for family view)
async function getResidentProgress(req, res) {
  try {
    const access = await pool.query(
      'SELECT 1 FROM family_links WHERE user_id = $1 AND resident_id = $2',
      [req.user.id, req.params.residentId]
    );
    if (req.user.role === 'family' && access.rows.length === 0) {
      return res.status(403).json({ error: 'You are not linked to this resident.' });
    }

    const [profile, health, medicines] = await Promise.all([
      pool.query('SELECT * FROM residents WHERE id = $1', [req.params.residentId]),
      pool.query('SELECT * FROM health_records WHERE resident_id = $1 ORDER BY record_date DESC LIMIT 10', [req.params.residentId]),
      pool.query('SELECT * FROM medicines WHERE resident_id = $1 AND is_active = TRUE', [req.params.residentId]),
    ]);

    res.json({
      profile: profile.rows[0],
      recent_health: health.rows,
      active_medicines: medicines.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching resident progress.' });
  }
}

// --- Visit Scheduling ---
async function scheduleVisit(req, res) {
  const { resident_id, visit_date, visit_time, purpose } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO visit_schedules (resident_id, family_user_id, visit_date, visit_time, purpose)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [resident_id, req.user.id, visit_date, visit_time, purpose]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error scheduling visit.' });
  }
}

async function getVisits(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM visit_schedules WHERE resident_id = $1 ORDER BY visit_date DESC',
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching visits.' });
  }
}

// --- Messages ---
async function sendMessage(req, res) {
  const { resident_id, message } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO messages (resident_id, sender_id, message) VALUES ($1,$2,$3) RETURNING *`,
      [resident_id, req.user.id, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error sending message.' });
  }
}

async function getMessages(req, res) {
  try {
    const result = await pool.query(
      `SELECT m.*, u.full_name AS sender_name FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.resident_id = $1 ORDER BY m.created_at ASC`,
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching messages.' });
  }
}

// --- Notifications ---
async function getNotifications(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching notifications.' });
  }
}

async function markNotificationRead(req, res) {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating notification.' });
  }
}

// GET /api/family/residents/:residentId/linked-users  (admin — see who has family access to this resident)
async function getLinkedUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.contact_number, fl.relationship
       FROM family_links fl
       JOIN users u ON u.id = fl.user_id
       WHERE fl.resident_id = $1`,
      [req.params.residentId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching linked family accounts.' });
  }
}

module.exports = {
  getMyResidents, linkFamilyMember, getResidentProgress, getLinkedUsers,
  scheduleVisit, getVisits, sendMessage, getMessages,
  getNotifications, markNotificationRead,
};