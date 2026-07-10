import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../../api/client';

const emptyForm = {
  record_date: new Date().toISOString().slice(0, 10),
  blood_pressure: '', blood_sugar: '', body_temperature: '', pulse_rate: '', spo2: '', weight: '', height: '', notes: '',
};

export default function HealthTab({ residentId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get(`/residents/${residentId}/health`)
      .then((res) => setRecords(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [residentId]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/residents/${residentId}/health`, form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch {
      alert('Could not save health record.');
    } finally {
      setSaving(false);
    }
  }

  const chartData = [...records].reverse().map((r) => ({
    date: new Date(r.record_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    'Pulse (bpm)': r.pulse_rate,
    'SpO₂ (%)': r.spo2,
    'Sugar (mg/dL)': r.blood_sugar,
  }));

  if (loading) return <div className="loading-state">Loading health records…</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <h3>Health Trend</h3>
        </div>
        {records.length === 0 ? (
          <p className="text-muted">No health records yet — add a check-up below to start tracking trends.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#D8E3DD" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#4B5D59' }} axisLine={{ stroke: '#D8E3DD' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#4B5D59' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D8E3DD', fontSize: '0.82rem' }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Line type="monotone" dataKey="Pulse (bpm)" stroke="#3D7A6B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="SpO₂ (%)" stroke="#4C7EA8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Sugar (mg/dL)" stroke="#E8A24C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Daily Check-ups</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : '+ Log Check-up'}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="form-grid" style={{ marginBottom: 18 }}>
            <div className="field">
              <label>Date *</label>
              <input required type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Blood Pressure</label>
              <input placeholder="120/80" value={form.blood_pressure} onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })} />
            </div>
            <div className="field">
              <label>Blood Sugar (mg/dL)</label>
              <input type="number" step="0.1" value={form.blood_sugar} onChange={(e) => setForm({ ...form, blood_sugar: e.target.value })} />
            </div>
            <div className="field">
              <label>Body Temperature (°F)</label>
              <input type="number" step="0.1" value={form.body_temperature} onChange={(e) => setForm({ ...form, body_temperature: e.target.value })} />
            </div>
            <div className="field">
              <label>Pulse Rate (bpm)</label>
              <input type="number" value={form.pulse_rate} onChange={(e) => setForm({ ...form, pulse_rate: e.target.value })} />
            </div>
            <div className="field">
              <label>SpO₂ (%)</label>
              <input type="number" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
            </div>
            <div className="field">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div className="field">
              <label>Height (cm)</label>
              <input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </div>
            <div className="field span-2">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="field span-2">
              <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Check-up'}</button>
            </div>
          </form>
        )}

        {records.length === 0 ? (
          <p className="text-muted">No check-ups logged yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>BP</th><th>Sugar</th><th>Temp</th><th>Pulse</th><th>SpO₂</th><th>Weight</th><th>BMI</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.record_date).toLocaleDateString()}</td>
                    <td>{r.blood_pressure || '—'}</td>
                    <td>{r.blood_sugar || '—'}</td>
                    <td>{r.body_temperature || '—'}</td>
                    <td>{r.pulse_rate || '—'}</td>
                    <td>{r.spo2 || '—'}</td>
                    <td>{r.weight || '—'}</td>
                    <td>{r.bmi || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
