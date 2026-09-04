const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('../backend/config/database');
const { initializeDatabase } = require('../backend/src/models/schema');
const authRoutes = require('../backend/src/routes/auth');
const dashboardRoutes = require('../backend/src/routes/dashboard');
const apiLogsRoutes = require('../backend/src/routes/apiLogs');
const teamsRoutes = require('../backend/src/routes/teams');
const analyticsRoutes = require('../backend/src/routes/analytics');
const projectsRoutes = require('../backend/src/routes/projects');
const apiKeysRoutes = require('../backend/src/routes/apiKeys');
const alertsRoutes = require('../backend/src/routes/alerts');
const auditRoutes = require('../backend/src/routes/audit');
const exportRoutes = require('../backend/src/routes/export');
const preferencesRoutes = require('../backend/src/routes/preferences');

const app = express();

let dbReady = false;

const ensureDb = async () => {
  if (!dbReady) {
    await initDatabase();
    initializeDatabase();
    dbReady = true;
  }
};

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ai-pulse-cost-tracker-296u-git-main-sneha-sharma-06s-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

app.use(async (req, res, next) => {
  await ensureDb();
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', apiLogsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/preferences', preferencesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
