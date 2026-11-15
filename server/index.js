import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { startReminderScheduler } from './services/cronService.js';

import authRoutes from './routes/auth.js';
import elderlyRoutes from './routes/elderly.js';
import medicationsRoutes from './routes/medications.js';
import adherenceRoutes from './routes/adherence.js';
import appointmentsRoutes from './routes/appointments.js';
import remindersRoutes from './routes/reminders.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Body parsing middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (for Cloud Run and container readiness probes)
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AuraCare Elderly Care & Medication Management Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/elderly', elderlyRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/adherence', adherenceRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Static frontend serving for production / Docker container
const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  console.log('[Server] Serving production frontend build from:', distPath);
  app.use(express.static(distPath));

  // SPA fallback for HTML5 History API client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 Error handler for unhandled API routes
app.use('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Initialize Database & Start Reminder Cron Engine
initDatabase();
startReminderScheduler(Number(process.env.REMINDER_INTERVAL_MINUTES) || 5);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🌟 AuraCare Healthcare Server running on port: ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🚀 Proactive reminder engine active`);
  console.log(`====================================================`);
});
