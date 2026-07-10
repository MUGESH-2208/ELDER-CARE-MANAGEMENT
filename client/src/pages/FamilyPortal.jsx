import React, { useEffect, useState } from 'react';
import api from '../api/client';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function FamilyPortal() {
  const [residents, setResidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api.get('/family/my-residents')
      .then((res) => {
        setResidents(res.data);
        if (res.data.length > 0) openResident(res.data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  function openResident(r) {
    setSelected(r);
    setLoadingDetail(true);
    Promise.all([
      api.get(`/family/residents/${r.id}/progress`),
      api.get(`/family/residents/${r.id}/messages`),
    ]).then(([progRes, msgRes]) => {
      setProgress(progRes.data);
      setMessages(msgRes.data);
    }).finally(() => setLoadingDetail(false));
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post('/family/messages', { resident_id: selected.id, message: newMessage });
      setNewMessage('');
      const res = await api.get(`/family/residents/${selected.id}/messages`);
      setMessages(res.data);
    } catch {
      alert('Could not send message.');
    }
  }

  if (loading) return <div className="loading-state">Loading your family portal…</div>;

  if (residents.length === 0) {
    return (
      <div className="empty-state card">
        <h3>No residents linked to your account yet</h3>
        <p>Ask the care facility's admin to link your login to your family member's profile.</p>
      </div>
    );
  }

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Your Family</h3>
        {residents.map((r) => (
          <button
            key={r.id}
            onClick={() => openResident(r)}
            className="btn-ghost"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
              padding: '10px 8px', borderRadius: 8,
              background: selected?.id === r.id ? 'var(--surface-sunken)' : 'transparent',
            }}
          >
            {r.profile_photo ? (
              <img src={r.profile_photo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--teal-100)', color: 'var(--teal-700)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 600,
              }}>
                {initials(r.full_name)}
              </span>
            )}
            <div>
              <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{r.full_name}</div>
              <div className="text-muted" style={{ fontSize: '0.76rem' }}>{r.relationship || 'Linked resident'}</div>
            </div>
          </button>
        ))}
      </div>

      <div>
        {loadingDetail || !progress ? (
          <div className="loading-state">Loading profile…</div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {progress.profile.profile_photo ? (
                  <img src={progress.profile.profile_photo} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span style={{
                    width: 64, height: 64, borderRadius: '50%', background: 'var(--teal-100)', color: 'var(--teal-700)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600,
                  }}>
                    {initials(progress.profile.full_name)}
                  </span>
                )}
                <div>
                  <h2 style={{ marginBottom: 2 }}>{progress.profile.full_name}</h2>
                  <p className="text-muted">Room {progress.profile.room_number || '—'} · <span className={`pill ${progress.profile.status?.toLowerCase()}`}>{progress.profile.status}</span></p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field"><label>Age</label><div>{progress.profile.age}</div></div>
                <div className="field"><label>Blood Group</label><div>{progress.profile.blood_group || '—'}</div></div>
                <div className="field"><label>Admitted</label><div>{progress.profile.date_of_admission ? new Date(progress.profile.date_of_admission).toLocaleDateString() : '—'}</div></div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Recent Health Check-ups</h3>
              {progress.recent_health.length === 0 ? (
                <p className="text-muted">No health records yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>BP</th><th>Pulse</th><th>SpO₂</th><th>Weight</th></tr></thead>
                    <tbody>
                      {progress.recent_health.map((h) => (
                        <tr key={h.id}>
                          <td>{new Date(h.record_date).toLocaleDateString()}</td>
                          <td>{h.blood_pressure || '—'}</td>
                          <td>{h.pulse_rate || '—'}</td>
                          <td>{h.spo2 || '—'}</td>
                          <td>{h.weight || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 12 }}>Active Medicines</h3>
              {progress.active_medicines.length === 0 ? (
                <p className="text-muted">No active medicines.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Medicine</th><th>Dosage</th><th>Schedule</th></tr></thead>
                    <tbody>
                      {progress.active_medicines.map((m) => (
                        <tr key={m.id}><td>{m.medicine_name}</td><td>{m.dosage || '—'}</td><td>{m.time_schedule || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Messages with Staff</h3>
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
                {messages.length === 0 ? (
                  <p className="text-muted">No messages yet.</p>
                ) : messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 10, fontSize: '0.86rem' }}>
                    <strong>{m.sender_name}:</strong> {m.message}
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8 }}
                  placeholder="Write a message to staff…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" type="submit">Send</button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}