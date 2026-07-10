import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const emptyForm = { medicine_name: '', dosage: '', frequency: '', time_schedule: '', start_date: '', end_date: '', stock_available: 0 };

export default function MedicineTab({ residentId }) {
  const [medicines, setMedicines] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const today = new Date().toISOString().slice(0, 10);

  function load() {
    setLoading(true);
    Promise.all([
      api.get(`/residents/${residentId}/medicines`),
      api.get(`/residents/${residentId}/medicines/logs`, { params: { date: today } }),
    ]).then(([medRes, logsRes]) => {
      setMedicines(medRes.data);
      setDailyLogs(logsRes.data);
    }).finally(() => setLoading(false));
  }

  useEffect(load, [residentId]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await api.post(`/residents/${residentId}/medicines`, form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add medicine.');
    }
  }

  async function markStatus(medicineId, status) {
    try {
      await api.post(`/medicines/${medicineId}/log`, { status, log_date: today });
      load();
    } catch {
      alert('Could not update medicine status.');
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Mark this medicine as inactive?')) return;
    await api.put(`/medicines/${id}`, { is_active: false });
    load();
  }

  if (loading) return <div className="loading-state">Loading medicines…</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <h3>Today's Medicine Status — {today}</h3>
        </div>
        {dailyLogs.length === 0 ? (
          <p className="text-muted">No active medicines scheduled.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Medicine</th><th>Dosage</th><th>Time</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {dailyLogs.map((log) => (
                  <tr key={log.medicine_id}>
                    <td>{log.medicine_name}</td>
                    <td>{log.dosage || '—'}</td>
                    <td>{log.time_schedule || '—'}</td>
                    <td><span className={`pill ${log.status.toLowerCase()}`}>{log.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => markStatus(log.medicine_id, 'Taken')}>Mark Taken</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => markStatus(log.medicine_id, 'Missed')}>Mark Missed</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <h3>All Medicines</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : '+ Add Medicine'}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="form-grid" style={{ marginBottom: 18 }}>
            <div className="field">
              <label>Medicine Name *</label>
              <input required value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Dosage</label>
              <input placeholder="e.g. 500mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
            </div>
            <div className="field">
              <label>Frequency</label>
              <input placeholder="e.g. Twice daily" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
            </div>
            <div className="field">
              <label>Time Schedule</label>
              <input placeholder="e.g. 8AM, 8PM" value={form.time_schedule} onChange={(e) => setForm({ ...form, time_schedule: e.target.value })} />
            </div>
            <div className="field">
              <label>Start Date *</label>
              <input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="field">
              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Stock Available</label>
              <input type="number" min="0" value={form.stock_available} onChange={(e) => setForm({ ...form, stock_available: e.target.value })} />
            </div>
            <div className="field span-2">
              <button className="btn btn-primary btn-sm" type="submit">Save Medicine</button>
            </div>
          </form>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Start</th><th>End</th><th>Stock</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id}>
                  <td>{m.medicine_name}</td>
                  <td>{m.dosage || '—'}</td>
                  <td>{m.frequency || '—'}</td>
                  <td>{new Date(m.start_date).toLocaleDateString()}</td>
                  <td>{m.end_date ? new Date(m.end_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`vring ${m.stock_available <= 5 ? 'warn' : 'ok'}`} />
                    {m.stock_available}
                  </td>
                  <td>{m.is_active ? <span className="pill active">Active</span> : <span className="pill discharged">Inactive</span>}</td>
                  <td>{m.is_active && <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(m.id)}>Deactivate</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
