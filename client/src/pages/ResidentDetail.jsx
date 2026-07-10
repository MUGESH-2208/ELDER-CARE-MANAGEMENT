import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileTab from '../components/resident-tabs/ProfileTab.jsx';
import MedicalTab from '../components/resident-tabs/MedicalTab.jsx';
import MedicineTab from '../components/resident-tabs/MedicineTab.jsx';
import HealthTab from '../components/resident-tabs/HealthTab.jsx';
import FamilyAccessTab from '../components/resident-tabs/FamilyAccessTab.jsx';

export default function ResidentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');

  const TABS = [
    { key: 'profile', label: 'Profile' },
    { key: 'medical', label: 'Medical Records' },
    { key: 'medicine', label: 'Medicine Management' },
    { key: 'health', label: 'Health Monitoring' },
    ...(user?.role === 'admin' ? [{ key: 'family', label: 'Family Access' }] : []),
  ];

  useEffect(() => {
    setLoading(true);
    api.get(`/residents/${id}`)
      .then((res) => setResident(res.data))
      .catch(() => setError('Resident not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-state">Loading resident…</div>;
  if (error) return <div className="card">{error} <Link className="row-link" to="/residents">Back to Residents</Link></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 style={{ marginBottom: 2 }}>{resident.full_name}</h2>
          <p className="text-muted">
            Room {resident.room_number || '—'} · Age {resident.age} · {resident.gender || '—'}
          </p>
        </div>
        <Link className="btn btn-secondary btn-sm" to="/residents">← Back to Residents</Link>
      </div>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab resident={resident} onUpdated={setResident} />}
      {tab === 'medical' && <MedicalTab residentId={id} />}
      {tab === 'medicine' && <MedicineTab residentId={id} />}
      {tab === 'health' && <HealthTab residentId={id} />}
      {tab === 'family' && user?.role === 'admin' && <FamilyAccessTab residentId={id} />}
    </div>
  );
}