const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
const authRoutes = require('./routes/auth');
const residentRoutes = require('./routes/residents');
const medicalRoutes = require('./routes/medical');
const residentMedicineRoutes = require('./routes/residentMedicines');
const medicineRoutes = require('./routes/medicines');
const healthRoutes = require('./routes/health');
const staffRoutes = require('./routes/staff');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const familyRoutes = require('./routes/family');
const appointmentRoutes = require('./routes/appointments');

app.use('/api/auth', authRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/residents/:residentId/medical', medicalRoutes);
app.use('/api/residents/:residentId/medicines', residentMedicineRoutes);
app.use('/api/residents/:residentId/health', healthRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/appointments', appointmentRoutes);

app.get('/api/health-check', (req, res) => {
  res.json({ status: 'OK', message: 'ElderCare API is running.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ElderCare API server running on http://localhost:${PORT}`);
});
