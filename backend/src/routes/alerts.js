const express = require('express');
const router = express.Router();
const { all, get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    const alerts = all(`SELECT ba.*, p.name as project_name, t.name as team_name FROM budget_alerts ba LEFT JOIN projects p ON ba.project_id = p.id LEFT JOIN teams t ON ba.team_id = t.id WHERE ba.user_id = ? ORDER BY ba.created_at DESC`, [req.user.id]);
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { threshold_percent, alert_type, project_id, team_id, notify_users } = req.body;
    const result = run('INSERT INTO budget_alerts (user_id, team_id, project_id, threshold_percent, alert_type, notify_users) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, team_id || null, project_id || null, threshold_percent || 80, alert_type || 'email', notify_users || '']);
    const alert = get('SELECT * FROM budget_alerts WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(alert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const existing = get('SELECT * FROM budget_alerts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Alert not found' });
    const threshold_percent = req.body.threshold_percent !== undefined ? req.body.threshold_percent : existing.threshold_percent;
    const alert_type = req.body.alert_type !== undefined ? req.body.alert_type : existing.alert_type;
    const is_active = req.body.is_active !== undefined ? req.body.is_active : existing.is_active;
    const notify_users = req.body.notify_users !== undefined ? req.body.notify_users : existing.notify_users;
    run('UPDATE budget_alerts SET threshold_percent = ?, alert_type = ?, is_active = ?, notify_users = ? WHERE id = ? AND user_id = ?', [threshold_percent, alert_type, is_active, notify_users, req.params.id, req.user.id]);
    const alert = get('SELECT * FROM budget_alerts WHERE id = ?', [req.params.id]);
    res.json(alert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    run('DELETE FROM budget_alerts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/notifications', auth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = all(`SELECT ah.*, ba.threshold_percent FROM alert_history ah LEFT JOIN budget_alerts ba ON ah.alert_id = ba.id WHERE ah.user_id = ? ORDER BY ah.created_at DESC LIMIT ?`, [req.user.id, limit]);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/notifications/:id/read', auth, (req, res) => {
  try {
    run('UPDATE alert_history SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/check', auth, (req, res) => {
  try {
    const alerts = all(`SELECT ba.*, COALESCE((SELECT SUM(total_cost) FROM api_logs WHERE user_id = ba.user_id AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')), 0) as current_spend FROM budget_alerts ba WHERE ba.user_id = ? AND ba.is_active = 1`, [req.user.id]);
    const triggered = [];
    for (const alert of alerts) {
      const teamBudget = alert.team_id ? get('SELECT budget_limit FROM teams WHERE id = ?', [alert.team_id]) : null;
      const projectBudget = alert.project_id ? get('SELECT budget_limit FROM projects WHERE id = ?', [alert.project_id]) : null;
      let budget = 1000;
      if (teamBudget) budget = teamBudget.budget_limit;
      if (projectBudget) budget = projectBudget.budget_limit;
      const percentUsed = (alert.current_spend / budget) * 100;
      if (percentUsed >= alert.threshold_percent) {
        const message = `Budget alert: ${percentUsed.toFixed(1)}% of $${budget.toFixed(2)} budget used ($${alert.current_spend.toFixed(2)} spent)`;
        run('INSERT INTO alert_history (alert_id, user_id, message, severity) VALUES (?, ?, ?, ?)', [alert.id, alert.user_id, message, percentUsed >= 100 ? 'critical' : 'warning']);
        run('UPDATE budget_alerts SET last_triggered = CURRENT_TIMESTAMP WHERE id = ?', [alert.id]);
        triggered.push({ alertId: alert.id, message, severity: percentUsed >= 100 ? 'critical' : 'warning' });
      }
    }
    res.json({ triggered });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
