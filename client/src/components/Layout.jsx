import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◎', end: true },
  { to: '/residents', label: 'Residents', icon: '◍' },
  { to: '/staff', label: 'Staff', icon: '◐' },
  { to: '/appointments', label: 'Appointments', icon: '◑' },
  { to: '/reports', label: 'Reports', icon: '◒' },
];

const FAMILY_NAV_ITEMS = [
  { to: '/', label: 'Family Portal', icon: '♥', end: true },
];

const PAGE_TITLES = {
  '/': ['Overview', "Today's snapshot across the care facility"],
  '/residents': ['Residents', 'Registrations, records, and search'],
  '/staff': ['Staff', 'Caregivers, attendance, and tasks'],
  '/appointments': ['Appointments', 'Doctor visits and schedules'],
  '/reports': ['Reports & Analytics', 'Trends and exportable summaries'],
};

const FAMILY_PAGE_TITLE = ['Family Portal', "Your loved one's profile and progress"];

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isFamily = user?.role === 'family';
  const navItems = isFamily ? FAMILY_NAV_ITEMS : ADMIN_NAV_ITEMS;

  let title, subtitle;
  if (isFamily) {
    [title, subtitle] = FAMILY_PAGE_TITLE;
  } else {
    let titleKey = location.pathname;
    if (titleKey.startsWith('/residents/') && titleKey !== '/residents') titleKey = '__resident_detail__';
    [title, subtitle] = PAGE_TITLES[titleKey] || ['Resident Profile', 'Full record for this resident'];
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <div className="brand-name">ElderCare</div>
            <div className="brand-sub">Care Console</div>
          </div>
        </div>

        <div className="nav-group-label">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-footer">
          Signed in as<br /><strong style={{ color: '#F3FAF6' }}>{user?.full_name}</strong>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            <div className="topbar-sub">{subtitle}</div>
          </div>
          <div className="user-chip">
            <div className="user-avatar">{initials(user?.full_name)}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user?.full_name}</div>
              <div className="user-role-tag">{user?.role}</div>
            </div>
            <button className="btn-ghost btn" onClick={logout} title="Log out">⎋</button>
          </div>
        </div>
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}