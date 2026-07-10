import React, { useState } from 'react';
import api from '../api/client';

const REPORT_TYPES = [
  { key: 'residents', label: 'Resident Report', endpoint: '/reports/residents' },
  { key: 'medicine-usage', label: 'Medicine Usage Report', endpoint: '/reports/medicine-usage' },
  { key: 'appointments', label: 'Appointment Report', endpoint: '/reports/appointments' },
  { key: 'staff-performance', label: 'Staff Performance Report', endpoint: '/reports/staff-performance' },
  { key: 'financial', label: 'Financial Report', endpoint: '/reports/financial' },
  { key: 'growth-stats', label: 'Resident Growth Statistics', endpoint: '/reports/growth-stats' },
];

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => escape(r[h])).join(',')));
  return lines.join('\n');
}

function downloadCSV(rows, filename) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [active, setActive] = useState(REPORT_TYPES[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function loadReport(type) {
    setActive(type);
    setLoading(true);
    setLoaded(false);
    api.get(type.endpoint)
      .then((res) => setRows(res.data))
      .finally(() => { setLoading(false); setLoaded(true); });
  }

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div>
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {REPORT_TYPES.map((t) => (
          <button
            key={t.key}
            className={`btn btn-sm ${active.key === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => loadReport(t)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="section-header">
          <h3>{active.label}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()} disabled={!rows.length}>Export to PDF (Print)</button>
            <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV(rows, `${active.key}-report.csv`)} disabled={!rows.length}>Export to Excel (CSV)</button>
          </div>
        </div>

        {!loaded && !loading && (
          <button className="btn btn-primary btn-sm" onClick={() => loadReport(active)}>Generate Report</button>
        )}
        {loading && <div className="loading-state">Generating report…</div>}
        {loaded && rows.length === 0 && <p className="text-muted">No data available for this report yet.</p>}
        {loaded && rows.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr>{columns.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>{columns.map((c) => <td key={c}>{String(r[c] ?? '—')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
