# ElderCare Management System

A full-stack elder care facility management system.

- **Frontend:** React (Vite), react-router-dom, axios, recharts
- **Backend:** Node.js, Express, JWT auth, bcrypt
- **Database:** PostgreSQL

## What's included

| Module | Status |
|---|---|
| Login & Authentication (JWT, roles, change/forgot password) | ✅ |
| Elderly Registration (full profile, search & filter) | ✅ |
| Medical Records (history, allergies, hospital visits, document upload) | ✅ |
| Medicine Management (schedules, daily status, missed tracking, stock, reminders) | ✅ |
| Health Monitoring (vitals, BMI auto-calc, trend chart, monthly report) | ✅ |
| Staff Management (registration, attendance, tasks, leaves, shifts, care notes) | ✅ |
| Dashboard (residents, staff, reminders, rooms, admissions chart) | ✅ |
| Reports & Analytics (residents, medicine usage, appointments, staff, financial, growth, CSV/print export) | ✅ |
| Search & Filter (name, room, disease, blood group, gender, admission date) | ✅ |
| Family Portal (linked residents, progress view, visit scheduling, messages, notifications) | ✅ backend + basic API |
| Video Calling | ⚠️ stubbed — needs a third-party provider, see note below |

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+

## 2. Database setup

```bash
createdb eldercare_db
psql -U postgres -d eldercare_db -f server/sql/schema.sql
```

## 3. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env: set DATABASE_URL and a strong JWT_SECRET
node seed.js        # creates default admin: admin / Admin@123
npm run dev         # starts API on http://localhost:5000
```

## 4. Frontend setup

```bash
cd client
npm install
npm run dev          # starts React app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` requests to `http://localhost:5000`, so just open http://localhost:5173 and log in.

**Change the default admin password immediately after your first login** (Settings → Change Password is exposed via `POST /api/auth/change-password`; wire up a small settings page or call it directly).

## 5. Production build

```bash
cd client
npm run build     # outputs static files to client/dist
```
Serve `client/dist` with any static host (nginx, Vercel, the Express server itself via `express.static`, etc.), pointing your API base URL at the deployed backend.

## Project structure

```
eldercare-system/
├── server/
│   ├── config/db.js            # PostgreSQL pool
│   ├── middleware/              # JWT auth, role guard, file upload
│   ├── controllers/             # business logic per module
│   ├── routes/                  # Express routers per module
│   ├── sql/schema.sql           # full database schema
│   ├── seed.js                  # creates default admin user
│   └── server.js                # app entry point
└── client/
    └── src/
        ├── api/client.js        # axios instance with JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/          # Layout, Modal, resident tab components
        ├── pages/                # Login, Dashboard, Residents, ResidentDetail,
        │                         # Staff, Appointments, Reports
        └── styles/index.css     # design tokens & component styles
```

## API overview

All endpoints are prefixed with `/api` and (except login/forgot-password) require
`Authorization: Bearer <token>`.

- `POST /auth/login`, `/auth/register` (admin only), `/auth/change-password`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/me`
- `GET/POST/PUT/DELETE /residents` — supports `?search=&room=&disease=&bloodGroup=&gender=&admissionDate=&status=`
- `GET/PUT /residents/:id/medical`, `/residents/:id/medical/hospital-visits`, `/residents/:id/medical/documents(/upload)`
- `GET/POST /residents/:id/medicines`, `GET /residents/:id/medicines/logs?date=`, `PUT/DELETE /medicines/:id`, `POST /medicines/:id/log`, `GET /medicines/missed-report`, `/medicines/low-stock`
- `GET/POST /residents/:id/health`, `GET /residents/:id/health/monthly-report`
- `GET/POST/PUT/DELETE /staff`, plus `/staff/:id/attendance`, `/staff/:id/shifts`, `/staff/:id/leaves`, `/staff/:id/tasks`, `/staff/:id/care-notes`, `/staff/:id/activity-logs`, `/staff/:id/performance`
- `GET /dashboard/summary`, `/dashboard/emergency-alerts`
- `GET /reports/residents|medicine-usage|appointments|staff-performance|financial|growth-stats|monthly-summary`
- `GET/POST/PUT/DELETE /appointments`
- `/family/*` — family portal endpoints (linking, progress view, visits, messages, notifications)

## Roles

- **admin** — full access, including staff registration and deletions
- **staff** — day-to-day data entry (residents, medical, medicine, health, tasks)
- **family** — read-only progress view for linked residents, messaging, visit scheduling

## Notes on Video Calling

Real-time video calling needs a signaling/media provider (e.g. **Twilio Video**, **Agora**, or **Daily.co**). The backend exposes a placeholder route, `POST /api/family/video-session`, where you'd generate that provider's session token; wire the provider's JS SDK into a new frontend component to complete this feature.
