const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { initDatabase } = require('../config/database');
const { initializeDatabase } = require('./models/schema');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiLogsRoutes = require('./routes/apiLogs');
const teamsRoutes = require('./routes/teams');
const analyticsRoutes = require('./routes/analytics');
const projectsRoutes = require('./routes/projects');
const apiKeysRoutes = require('./routes/apiKeys');
const alertsRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');
const exportRoutes = require('./routes/export');
const preferencesRoutes = require('./routes/preferences');

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await initDatabase();
  initializeDatabase();

  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://ai-pulse-cost-tracker-2ewe.vercel.app',
      'https://ai-pulse-cost-tracker-296u-git-main-sneha-sharma-06s-projects.vercel.app'
    ],
    credentials: true
  }));
  app.use(express.json());

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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);

module.exports = app;
