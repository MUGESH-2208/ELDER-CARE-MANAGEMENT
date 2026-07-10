import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client';

function StatCard({ label, value, hint, ringClass }) {
  return (
    <div className="stat-card">
      <div className="stat-label">
        <span className={`vring ${ringClass || 'ok'}`} />
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setError('Could not load dashboard data. Is the API server running and the database reachable?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading dashboard…</div>;
  if (error) return <div className="card">{error}</div>;
  if (!summary) return null;

  const chartData = summary.monthly_admissions.map((m) => ({ month: m.month, admissions: parseInt(m.count) }));
  const male = summary.gender_stats.Male || 0;
  const female = summary.gender_stats.Female || 0;

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Total Residents" value={summary.total_residents} hint={`${summary.active_residents} active`} ringClass="ok" />
        <StatCard label="Male / Female" value={`${male} / ${female}`} hint="Current residents" ringClass="ok" />
        <StatCard label="Total Staff" value={summary.total_staff} hint="Active caregivers" ringClass="ok" />
        <StatCard
          label="Medicine Reminders"
          value={summary.pending_medicine_reminders}
          hint="Not yet marked taken today"
          ringClass={summary.pending_medicine_reminders > 0 ? 'warn' : 'ok'}
        />
        <StatCard label="Today's Checkups" value={summary.todays_checkups} hint="Health monitoring logged today" ringClass="ok" />
        <StatCard label="Upcoming Appointments" value={summary.upcoming_appointments} hint="Scheduled from today onward" ringClass="ok" />
        <StatCard
          label="Occupied Rooms"
          value={summary.rooms.occupied}
          hint={`${summary.rooms.vacant} vacant`}
          ringClass="ok"
        />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 4 }}>Admissions — last 6 months</h3>
        <p className="text-muted" style={{ marginBottom: 16, fontSize: '0.84rem' }}>New residents admitted per month</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="#D8E3DD" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#4B5D59' }} axisLine={{ stroke: '#D8E3DD' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#4B5D59' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D8E3DD', fontSize: '0.82rem' }} />
            <Bar dataKey="admissions" fill="#3D7A6B" radius={[6, 6, 0, 0]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
