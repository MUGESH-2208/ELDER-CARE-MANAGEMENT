import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Residents from './pages/Residents.jsx';
import ResidentDetail from './pages/ResidentDetail.jsx';
import Staff from './pages/Staff.jsx';
import Reports from './pages/Reports.jsx';
import Appointments from './pages/Appointments.jsx';
import FamilyPortal from './pages/FamilyPortal.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  if (user?.role === 'family') {
    return (
      <Routes>
        <Route path="/" element={<FamilyPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/residents" element={<Residents />} />
      <Route path="/residents/:id" element={<ResidentDetail />} />
      <Route path="/staff" element={<Staff />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <AppRoutes />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}