import React, { useEffect, useState } from 'react';
import api from '../api/client';
import Modal from '../components/Modal.jsx';

const emptyForm = { full_name: '', designation: '', contact_number: '', email: '', address: '' };

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null); // staff member for task/leave modal
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({ task_description: '', due_date: '' });
  const today = new Date().toISOString().slice(0, 10);

  function load() {
    setLoading(true);
    api.get('/staff').then((res) => setStaff(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/staff', form);
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not add staff member.');
    } finally {
      setSaving(false);
    }
  }

  async function markAttendance(staffId, status) {
    try {
      await api.post(`/staff/${staffId}/attendance`, { status, attendance_date: today });
      alert(`Marked ${status} for today.`);
    } catch {
      alert('Could not mark attendance.');
    }
  }

  function openTasks(member) {
    setSelected(member);
    api.get(`/staff/${member.id}/tasks`).then((res) => setTasks(res.data));
  }

  async function addTask(e) {
    e.preventDefault();
    try {
      await api.post(`/staff/${selected.id}/tasks`, taskForm);
      setTaskForm({ task_description: '', due_date: '' });
      const res = await api.get(`/staff/${selected.id}/tasks`);
      setTasks(res.data);
    } catch {
      alert('Could not assign task.');
    }
  }

  async function toggleTaskStatus(task) {
    const next = task.status === 'Completed' ? 'Pending' : 'Completed';
    await api.put(`/staff/${selected.id}/tasks/${task.id}`, { status: next });
    const res = await api.get(`/staff/${selected.id}/tasks`);
    setTasks(res.data);
  }

  return (
    <div>
      <div className="section-header">
        <div />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Register Staff</button>
      </div>

      {loading ? (
        <div className="loading-state">Loading staff…</div>
      ) : staff.length === 0 ? (
        <div className="empty-state card"><h3>No staff registered yet</h3><p>Add your first caregiver to get started.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Designation</th><th>Contact</th><th>Email</th><th>Joined</th><th>Attendance Today</th><th></th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.full_name}</td>
                  <td>{s.designation || '—'}</td>
                  <td>{s.contact_number || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td>{s.date_joined ? new Date(s.date_joined).toLocaleDateString() : '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => markAttendance(s.id, 'Present')}>Present</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => markAttendance(s.id, 'Absent')}>Absent</button>
                  </td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => openTasks(s)}>Tasks</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Register Staff Member" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="form-grid">
            <div className="field span-2">
              <label>Full Name *</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Designation</label>
              <input placeholder="e.g. Caregiver, Nurse" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div className="field">
              <label>Contact Number</label>
              <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
            </div>
            <div className="field span-2">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field span-2">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="field span-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Staff'}</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={`Tasks — ${selected.full_name}`} onClose={() => setSelected(null)}>
          <form onSubmit={addTask} className="form-grid" style={{ marginBottom: 18 }}>
            <div className="field span-2">
              <label>Task Description *</label>
              <input required value={taskForm.task_description} onChange={(e) => setTaskForm({ ...taskForm, task_description: e.target.value })} />
            </div>
            <div className="field">
              <label>Due Date</label>
              <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
            </div>
            <div className="field" style={{ justifyContent: 'flex-end', display: 'flex' }}>
              <button className="btn btn-primary btn-sm" type="submit" style={{ marginTop: 'auto' }}>Assign Task</button>
            </div>
          </form>

          {tasks.length === 0 ? (
            <p className="text-muted">No tasks assigned yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Task</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.task_description}</td>
                      <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                      <td>
                        <button className={`pill ${t.status === 'Completed' ? 'taken' : 'pending'}`} onClick={() => toggleTaskStatus(t)} style={{ border: 'none' }}>
                          {t.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
