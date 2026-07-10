import React, { useEffect, useState } from 'react';
import api from '../../api/client';

const emptyForm = { full_name: '', username: '', password: '', relationship: '', contact_number: '' };

export default function FamilyAccessTab({ residentId }) {
  const [linked, setLinked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get(`/family/residents/${residentId}/linked-users`)
      .then((res) => setLinked(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [residentId]);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Create the family login
      const userRes = await api.post('/auth/register', {
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        role: 'family',
        contact_number: form.contact_number,
      });

      // 2. Link that account to this resident
      await api.post('/family/link', {
        user_id: userRes.data.id,
        resident_id: residentId,
        relationship: form.relationship,
      });

      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not create family access.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <h3>Family Access</h3>
          <p className="text-muted" style={{ fontSize: '0.84rem' }}>
            Give a relative their own login so they can view this resident's profile, health updates, and active medicines.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : '+ Add Family Login'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="form-grid" style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Family Member's Full Name *</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="field">
            <label>Relationship</label>
            <input placeholder="e.g. Son, Daughter" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
          </div>
          <div className="field">
            <label>Username *</label>
            <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="field">
            <label>Temporary Password *</label>
            <input required type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field span-2">
            <label>Contact Number</label>
            <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
          </div>
          <div className="field span-2">
            <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create & Link Account'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-state">Loading…</div>
      ) : linked.length === 0 ? (
        <p className="text-muted">No family members have login access yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Relationship</th><th>Username</th><th>Contact</th></tr></thead>
            <tbody>
              {linked.map((f) => (
                <tr key={f.id}>
                  <td>{f.full_name}</td>
                  <td>{f.relationship || '—'}</td>
                  <td>{f.username}</td>
                  <td>{f.contact_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}