const express = require('express');
const router = express.Router();
const { all, get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  try {
    const teams = all(`SELECT t.*, u.name as owner_name, (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count, (SELECT COALESCE(SUM(total_cost), 0) FROM api_logs WHERE team_id = t.id AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')) as monthly_cost FROM teams t JOIN users u ON t.owner_id = u.id WHERE t.id IN (SELECT team_id FROM team_members WHERE user_id = ?)`, [req.user.id]);
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, budget_limit } = req.body;
    const result = run('INSERT INTO teams (name, budget_limit, owner_id) VALUES (?, ?, ?)', [name, budget_limit || 1000, req.user.id]);
    run('INSERT INTO team_members (team_id, user_id, role, invited_by) VALUES (?, ?, ?, ?)', [result.lastInsertRowid, req.user.id, 'owner', req.user.id]);
    const team = get('SELECT * FROM teams WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/members', auth, (req, res) => {
  try {
    const membership = get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!membership) return res.status(403).json({ error: 'Access denied' });
    const members = all(`SELECT tm.*, u.username, u.name, u.avatar_color FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?`, [req.params.id]);
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/members', auth, (req, res) => {
  try {
    const membership = get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!membership || !['owner', 'admin'].includes(membership.role)) return res.status(403).json({ error: 'Only owners/admins can invite' });
    const { username, role } = req.body;
    const user = get('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, user.id]);
    if (existing) return res.status(400).json({ error: 'User already in team' });
    run('INSERT INTO team_members (team_id, user_id, role, invited_by) VALUES (?, ?, ?, ?)', [req.params.id, user.id, role || 'member', req.user.id]);
    res.status(201).json({ message: 'Member added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/members/:userId', auth, (req, res) => {
  try {
    const membership = get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!membership || !['owner', 'admin'].includes(membership.role)) return res.status(403).json({ error: 'Permission denied' });
    run('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const membership = get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!membership || membership.role !== 'owner') return res.status(403).json({ error: 'Only owner can update team' });
    const { name, budget_limit } = req.body;
    run('UPDATE teams SET name = COALESCE(?, name), budget_limit = COALESCE(?, budget_limit) WHERE id = ?', [name, budget_limit, req.params.id]);
    const team = get('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/costs', auth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const membership = get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!membership) return res.status(403).json({ error: 'Access denied' });
    const costs = all(`SELECT u.name as user_name, u.username, SUM(al.total_cost) as total_cost, SUM(al.total_tokens) as total_tokens, COUNT(*) as call_count FROM api_logs al JOIN users u ON al.user_id = u.id WHERE al.team_id = ? AND al.created_at >= datetime('now', '-' || ? || ' days') GROUP BY al.user_id ORDER BY total_cost DESC`, [req.params.id, days]);
    const stats = get(`SELECT COALESCE(SUM(total_cost), 0) as total_cost, COALESCE(SUM(total_tokens), 0) as total_tokens, COUNT(*) as total_calls FROM api_logs WHERE team_id = ? AND created_at >= datetime('now', '-' || ? || ' days')`, [req.params.id, days]);
    const team = get('SELECT * FROM teams WHERE id = ?', [req.params.id]);
    res.json({ team, stats, breakdown: costs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
