const express = require('express');
const router = express.Router();
const { get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    let prefs = get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    if (!prefs) { run('INSERT INTO user_preferences (user_id) VALUES (?)', [req.user.id]); prefs = get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]); }
    res.json(prefs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', auth, (req, res) => {
  try {
    const existing = get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    if (!existing) run('INSERT INTO user_preferences (user_id) VALUES (?)', [req.user.id]);
    const current = get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    const theme = req.body.theme !== undefined ? req.body.theme : current.theme;
    const language = req.body.language !== undefined ? req.body.language : current.language;
    const timezone = req.body.timezone !== undefined ? req.body.timezone : current.timezone;
    const email_notifications = req.body.email_notifications !== undefined ? req.body.email_notifications : current.email_notifications;
    const budget_alert_enabled = req.body.budget_alert_enabled !== undefined ? req.body.budget_alert_enabled : current.budget_alert_enabled;
    const default_date_range = req.body.default_date_range !== undefined ? req.body.default_date_range : current.default_date_range;
    run('UPDATE user_preferences SET theme = ?, language = ?, timezone = ?, email_notifications = ?, budget_alert_enabled = ?, default_date_range = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [theme, language, timezone, email_notifications, budget_alert_enabled, default_date_range, req.user.id]);
    const prefs = get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
    res.json(prefs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
