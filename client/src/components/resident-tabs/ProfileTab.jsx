import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/client';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProfileTab({ resident, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(resident);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Keep the edit form in sync with the latest resident data (e.g. after a
  // photo upload) as long as the user isn't actively mid-edit, so a stale
  // snapshot never gets written back over a newer change.
  useEffect(() => {
    if (!editing) setForm(resident);
  }, [resident, editing]);

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await api.post(`/residents/${resident.id}/photo`, formData);
      onUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not upload photo. Use JPG or PNG under 10MB.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function field(key, label, type = 'text', options) {
    if (!editing) {
      return (
        <div className="field">
          <label>{label}</label>
          <div>{resident[key] || '—'}</div>
        </div>
      );
    }
    if (options) {
      return (
        <div className="field">
          <label>{label}</label>
          <select value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
            <option value="">Select</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div className="field">
        <label>{label}</label>
        <input type={type} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    const { profile_photo, ...payload } = form; // photo is managed by its own upload endpoint
    try {
      const res = await api.put(`/residents/${resident.id}`, payload);
      onUpdated(res.data);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update resident.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-header" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {resident.profile_photo ? (
            <img
              src={resident.profile_photo}
              alt={resident.full_name}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--line)' }}
            />
          ) : (
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%', background: 'var(--teal-100)',
                color: 'var(--teal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 600, fontFamily: 'var(--font-display)',
              }}
            >
              {initials(resident.full_name)}
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? 'Uploading…' : resident.profile_photo ? 'Change Photo' : '+ Add Photo'}
            </button>
            <div className="text-muted" style={{ fontSize: '0.74rem', marginTop: 6 }}>JPG or PNG, up to 10MB</div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h3>Personal Information</h3>
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setForm(resident); setEditing(false); }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>
        )}
      </div>

      <div className="form-grid">
        {field('full_name', 'Full Name')}
        {field('age', 'Age', 'number')}
        {field('gender', 'Gender', 'text', ['Male', 'Female', 'Other'])}
        {field('contact_number', 'Contact Number')}
        {field('emergency_contact', 'Emergency Contact')}
        {field('blood_group', 'Blood Group', 'text', BLOOD_GROUPS)}
        {field('room_number', 'Room Number')}
        {field('date_of_admission', 'Date of Admission', 'date')}
        {field('aadhaar_id', 'Aadhaar / ID Number')}
        {field('marital_status', 'Marital Status', 'text', ['Single', 'Married', 'Widowed', 'Divorced'])}
        {field('occupation', 'Occupation (before retirement)')}
        {field('status', 'Profile Status', 'text', ['Active', 'Discharged', 'Deceased'])}
        <div className="field span-2">
          <label>Address</label>
          {editing
            ? <textarea rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            : <div>{resident.address || '—'}</div>}
        </div>
        <div className="field span-2">
          <label>Guardian / Family Information</label>
          {editing
            ? <textarea rows={2} value={form.guardian_info || ''} onChange={(e) => setForm({ ...form, guardian_info: e.target.value })} />
            : <div>{resident.guardian_info || '—'}</div>}
        </div>
      </div>
    </div>
  );
}