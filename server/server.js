// ============================================================
// server.js — KAUTHIG Express Application Entry Point
// ============================================================

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// ── Route Imports ──────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const { eventSessionRouter, sessionRouter } = require('./routes/session.routes');
const { staffRouter, myAssignmentsRouter } = require('./routes/staff.routes');
const { sessionRegistrationRouter, registrationRouter } = require('./routes/registration.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const alertRoutes = require('./routes/alert.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// ── Global Middleware ──────────────────────────────────────
app.use(cors({
    origin: config.frontendOrigin,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/sessions', eventSessionRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/sessions/:sessionId/staff', staffRouter);
app.use('/api/my-assignments', myAssignmentsRouter);
app.use('/api/sessions/:sessionId/registrations', sessionRegistrationRouter);
app.use('/api/registrations', registrationRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);

// ── SPA Fallback (serve index.html for all non-API routes) ─
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║       KAUTHIG — Event Registration       ║
║       Server running on port ${String(config.port).padEnd(5)}       ║
║       http://localhost:${config.port}              ║
╚══════════════════════════════════════════╝
    `);
});