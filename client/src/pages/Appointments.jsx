import React, { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal.jsx';

const emptyForm = { resident_id: '', doctor_name: '', appointment_date: '', appointment_time: '', purpose: '' };

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get('/appointments'), api.get('/residents')])
      .then(([apptRes, resRes]) => { setAppointments(apptRes.data); setResidents(resRes.data); })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/appointments', form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not schedule appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    await api.put(`/appointments/${id}`, { status });
    load();
  }

  return (
    <div>
      <div className="section-header">
        <div />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Schedule Appointment</button>
      </div>

      {loading ? (
        <div className="loading-state">Loading appointments…</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state card"><h3>No appointments scheduled</h3><p>Schedule a doctor visit for a resident.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Resident</th><th>Room</th><th>Doctor</th><th>Date</th><th>Time</th><th>Purpose</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.full_name}</td>
                  <td>{a.room_number || '—'}</td>
                  <td>{a.doctor_name || '—'}</td>
                  <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                  <td>{a.appointment_time || '—'}</td>
                  <td>{a.purpose || '—'}</td>
                  <td><span className={`pill ${a.status === 'Completed' ? 'taken' : a.status === 'Cancelled' ? 'missed' : 'pending'}`}>{a.status}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {a.status === 'Scheduled' && (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(a.id, 'Completed')}>Complete</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(a.id, 'Cancelled')}>Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Schedule Appointment" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <div className="field span-2">
              <label>Resident *</label>
              <select required value={form.resident_id} onChange={(e) => setForm({ ...form, resident_id: e.target.value })}>
                <option value="">Select resident</option>
                {residents.map((r) => <option key={r.id} value={r.id}>{r.full_name} (Room {r.room_number || '—'})</option>)}
              </select>
            </div>
            <div className="field">
              <label>Doctor Name</label>
              <input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Date *</label>
              <input required type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Time</label>
              <input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
            </div>
            <div className="field span-2">
              <label>Purpose</label>
              <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div className="field span-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Schedule'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
