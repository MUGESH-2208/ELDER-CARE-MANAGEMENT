import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal.jsx';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyForm = {
  full_name: '', age: '', gender: 'Male', contact_number: '', emergency_contact: '',
  address: '', blood_group: '', date_of_admission: '', room_number: '', aadhaar_id: '',
  marital_status: '', guardian_info: '', occupation: '', status: 'Active',
};

function statusRing(status) {
  if (status === 'Active') return 'ok';
  if (status === 'Discharged') return 'muted';
  return 'danger';
}

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [filters, setFilters] = useState({ search: '', room: '', disease: '', bloodGroup: '', gender: '', status: '' });

  const loadResidents = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/residents', { params })
      .then((res) => setResidents(res.data))
      .catch(() => setError('Could not load residents.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(loadResidents, 250); // debounce typing
    return () => clearTimeout(t);
  }, [loadResidents]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetAddForm() {
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post('/residents', { ...form, age: parseInt(form.age) });

      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        await api.post(`/residents/${created.data.id}/photo`, formData);
      }

      setShowAdd(false);
      resetAddForm();
      loadResidents();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not save resident.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="section-header">
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <input
            placeholder="Search by name…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
          <input
            placeholder="Room number…"
            value={filters.room}
            onChange={(e) => updateFilter('room', e.target.value)}
          />
          <input
            placeholder="Disease…"
            value={filters.disease}
            onChange={(e) => updateFilter('disease', e.target.value)}
          />
          <select value={filters.bloodGroup} onChange={(e) => updateFilter('bloodGroup', e.target.value)}>
            <option value="">All blood groups</option>
            {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <select value={filters.gender} onChange={(e) => updateFilter('gender', e.target.value)}>
            <option value="">All genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Discharged">Discharged</option>
            <option value="Deceased">Deceased</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Register Resident</button>
      </div>

      {error && <div className="card" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="loading-state">Loading residents…</div>
      ) : residents.length === 0 ? (
        <div className="empty-state card">
          <h3>No residents match these filters</h3>
          <p>Try clearing a filter, or register a new resident to get started.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Age</th><th>Gender</th><th>Room</th>
                <th>Blood Group</th><th>Admitted</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link className="row-link" to={`/residents/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.profile_photo ? (
                        <img src={r.profile_photo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{
                          width: 30, height: 30, borderRadius: '50%', background: 'var(--teal-100)', color: 'var(--teal-700)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600,
                        }}>
                          {r.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      )}
                      {r.full_name}
                    </Link>
                  </td>
                  <td>{r.age}</td>
                  <td>{r.gender || '—'}</td>
                  <td>{r.room_number || '—'}</td>
                  <td>{r.blood_group || '—'}</td>
                  <td>{r.date_of_admission ? new Date(r.date_of_admission).toLocaleDateString() : '—'}</td>
                  <td><span className={`pill ${r.status?.toLowerCase()}`}><span className={`vring ${statusRing(r.status)}`} />{r.status}</span></td>
                  <td><Link className="btn btn-secondary btn-sm" to={`/residents/${r.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Register New Resident" onClose={() => { setShowAdd(false); resetAddForm(); }} width="720px">
          <form onSubmit={handleAdd}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }} />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'var(--teal-100)', color: 'var(--teal-700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600,
                }}>
                  ?
                </div>
              )}
              <div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  {photoFile ? 'Change Photo' : '+ Add Photo'}
                  <input type="file" accept="image/png,image/jpeg,image/jpg" style={{ display: 'none' }} onChange={handlePhotoChange} />
                </label>
                <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: 6 }}>Optional — JPG or PNG, up to 10MB</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field span-2">
                <label>Full Name *</label>
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="field">
                <label>Age *</label>
                <input required type="number" min="0" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="field">
                <label>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Contact Number</label>
                <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
              </div>
              <div className="field">
                <label>Emergency Contact</label>
                <input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
              </div>
              <div className="field span-2">
                <label>Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="field">
                <label>Blood Group</label>
                <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Room Number</label>
                <input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
              </div>
              <div className="field">
                <label>Date of Admission</label>
                <input type="date" value={form.date_of_admission} onChange={(e) => setForm({ ...form, date_of_admission: e.target.value })} />
              </div>
              <div className="field">
                <label>Aadhaar / ID Number</label>
                <input value={form.aadhaar_id} onChange={(e) => setForm({ ...form, aadhaar_id: e.target.value })} />
              </div>
              <div className="field">
                <label>Marital Status</label>
                <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })}>
                  <option value="">Select</option>
                  <option>Single</option><option>Married</option><option>Widowed</option><option>Divorced</option>
                </select>
              </div>
              <div className="field">
                <label>Occupation (before retirement)</label>
                <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
              </div>
              <div className="field span-2">
                <label>Guardian / Family Information</label>
                <input value={form.guardian_info} onChange={(e) => setForm({ ...form, guardian_info: e.target.value })} />
              </div>
              <div className="field">
                <label>Profile Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option><option>Discharged</option><option>Deceased</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowAdd(false); resetAddForm(); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Resident'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}