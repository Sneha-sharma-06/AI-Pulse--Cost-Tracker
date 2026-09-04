const express = require('express');
const router = express.Router();
const { all, get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    const projects = all(`SELECT p.*, (SELECT COUNT(*) FROM api_logs WHERE project_id = p.id) as total_calls, (SELECT COALESCE(SUM(total_cost), 0) FROM api_logs WHERE project_id = p.id AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as monthly_cost FROM projects p WHERE p.user_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC`, [req.user.id]);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, description, budget_limit, color } = req.body;
    const result = run('INSERT INTO projects (user_id, team_id, name, description, budget_limit, color) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, null, name, description, budget_limit, color || '#0ea5e9']);
    const project = get('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const existing = get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Project not found' });
    const name = req.body.name !== undefined ? req.body.name : existing.name;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const budget_limit = req.body.budget_limit !== undefined ? req.body.budget_limit : existing.budget_limit;
    const color = req.body.color !== undefined ? req.body.color : existing.color;
    const is_active = req.body.is_active !== undefined ? req.body.is_active : existing.is_active;
    run('UPDATE projects SET name = ?, description = ?, budget_limit = ?, color = ?, is_active = ? WHERE id = ? AND user_id = ?', [name, description, budget_limit, color, is_active, req.params.id, req.user.id]);
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    run('UPDATE projects SET is_active = 0 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/costs', auth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const dailyCosts = all(`SELECT DATE(created_at) as date, SUM(total_cost) as cost, SUM(total_tokens) as tokens, COUNT(*) as calls FROM api_logs WHERE project_id = ? AND user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY DATE(created_at) ORDER BY date ASC`, [req.params.id, req.user.id, days]);
    const modelCosts = all(`SELECT model, SUM(total_cost) as cost, COUNT(*) as calls FROM api_logs WHERE project_id = ? AND user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY model ORDER BY cost DESC`, [req.params.id, req.user.id, days]);
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json({ project, dailyCosts, modelCosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
