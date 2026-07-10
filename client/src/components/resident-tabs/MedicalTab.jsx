import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const FIELDS = [
  ['medical_history', 'Medical History'],
  ['current_diseases', 'Current Diseases'],
  ['allergies', 'Allergies'],
  ['chronic_illnesses', 'Chronic Illnesses'],
  ['current_medications', 'Current Medications'],
  ['doctor_name', 'Doctor Name'],
  ['doctor_contact', 'Doctor Contact'],
  ['hospital_name', 'Hospital Name'],
  ['vaccination_records', 'Vaccination Records'],
  ['surgical_history', 'Surgical History'],
];

export default function MedicalTab({ residentId }) {
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visits, setVisits] = useState([]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitForm, setVisitForm] = useState({ visit_date: '', reason: '', hospital_name: '', doctor_name: '', notes: '' });

  function load() {
    setLoading(true);
    Promise.all([
      api.get(`/residents/${residentId}/medical`),
      api.get(`/residents/${residentId}/medical/hospital-visits`),
    ]).then(([medRes, visitsRes]) => {
      setRecord(medRes.data || {});
      setForm(medRes.data || {});
      setVisits(visitsRes.data);
    }).finally(() => setLoading(false));
  }

  useEffect(load, [residentId]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.put(`/residents/${residentId}/medical`, form);
      setRecord(res.data);
      setEditing(false);
    } catch (err) {
      alert('Could not save medical record.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVisit(e) {
    e.preventDefault();
    try {
      await api.post(`/residents/${residentId}/medical/hospital-visits`, visitForm);
      setShowVisitForm(false);
      setVisitForm({ visit_date: '', reason: '', hospital_name: '', doctor_name: '', notes: '' });
      load();
    } catch {
      alert('Could not add hospital visit.');
    }
  }

  if (loading) return <div className="loading-state">Loading medical record…</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <h3>Medical Record</h3>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setForm(record); setEditing(false); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit Record</button>
          )}
        </div>
        <div className="form-grid">
          {FIELDS.map(([key, label]) => (
            <div className="field span-2" key={key}>
              <label>{label}</label>
              {editing ? (
                <textarea rows={2} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              ) : (
                <div>{record?.[key] || '—'}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Hospital Visit History</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowVisitForm((v) => !v)}>
            {showVisitForm ? 'Cancel' : '+ Add Visit'}
          </button>
        </div>

        {showVisitForm && (
          <form onSubmit={handleAddVisit} className="form-grid" style={{ marginBottom: 18 }}>
            <div className="field">
              <label>Visit Date *</label>
              <input required type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} />
            </div>
            <div className="field">
              <label>Hospital Name</label>
              <input value={visitForm.hospital_name} onChange={(e) => setVisitForm({ ...visitForm, hospital_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Doctor Name</label>
              <input value={visitForm.doctor_name} onChange={(e) => setVisitForm({ ...visitForm, doctor_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Reason</label>
              <input value={visitForm.reason} onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })} />
            </div>
            <div className="field span-2">
              <label>Notes</label>
              <textarea rows={2} value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} />
            </div>
            <div className="field span-2">
              <button className="btn btn-primary btn-sm" type="submit">Save Visit</button>
            </div>
          </form>
        )}

        {visits.length === 0 ? (
          <p className="text-muted">No hospital visits recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Hospital</th><th>Doctor</th><th>Reason</th></tr></thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.visit_date).toLocaleDateString()}</td>
                    <td>{v.hospital_name || '—'}</td>
                    <td>{v.doctor_name || '—'}</td>
                    <td>{v.reason || '—'}</td>
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
