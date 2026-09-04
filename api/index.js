const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, getDb, saveDatabase } = require('../backend/config/database');
const { initializeDatabase } = require('../backend/src/models/schema');
const { get, run } = require('../backend/src/utils/dbHelper');
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

const seedDefaultUser = async () => {
  try {
    const existing = get('SELECT id FROM users WHERE username = ?', ['sneha']);
    if (!existing) {
      const hashedPassword = await bcrypt.hash('Secure123', 10);
      const result = run('INSERT INTO users (username, password, name) VALUES (?, ?, ?)', ['sneha', hashedPassword, 'Sneha']);
      const userId = result.lastInsertRowid;
      run('INSERT INTO teams (name, budget_limit, owner_id) VALUES (?, ?, ?)', ["Sneha's Team", 2500, userId]);
      const teamRow = get('SELECT id FROM teams WHERE owner_id = ?', [userId]);
      if (teamRow) {
        run('INSERT INTO team_members (team_id, user_id, role, invited_by) VALUES (?, ?, ?, ?)', [teamRow.id, userId, 'owner', userId]);
      }
      saveDatabase();
    }
  } catch (err) {
    console.error('Seed error:', err);
  }
};

const ensureDb = async () => {
  if (!dbReady) {
    try {
      await initDatabase();
      initializeDatabase();
      await seedDefaultUser();
      dbReady = true;
    } catch (err) {
      console.error('DB init error:', err);
      throw err;
    }
  }
};

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

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error('Middleware error:', err);
    res.status(500).json({ error: 'Database initialization failed' });
  }
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
