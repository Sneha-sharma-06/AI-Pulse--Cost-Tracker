const express = require('express');
const router = express.Router();
const { all, get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  try {
    const { model, provider, endpoint, prompt_tokens, completion_tokens, total_cost, latency_ms, status } = req.body;
    const total_tokens = (prompt_tokens || 0) + (completion_tokens || 0);
    const result = run(`INSERT INTO api_logs (user_id, model, provider, endpoint, prompt_tokens, completion_tokens, total_tokens, total_cost, latency_ms, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.user.id, model, provider, endpoint || '', prompt_tokens || 0, completion_tokens || 0, total_tokens, total_cost || 0, latency_ms || 0, status || 'success']);
    res.status(201).json({ id: result.lastInsertRowid, message: 'API call logged successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', auth, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM api_logs WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM api_logs WHERE user_id = ?';
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (req.query.model) { query += ' AND model = ?'; countQuery += ' AND model = ?'; params.push(req.query.model); countParams.push(req.query.model); }
    if (req.query.provider) { query += ' AND provider = ?'; countQuery += ' AND provider = ?'; params.push(req.query.provider); countParams.push(req.query.provider); }
    if (req.query.start_date) { query += ' AND created_at >= ?'; countQuery += ' AND created_at >= ?'; params.push(req.query.start_date); countParams.push(req.query.start_date); }
    if (req.query.end_date) { query += ' AND created_at <= ?'; countQuery += ' AND created_at <= ?'; params.push(req.query.end_date); countParams.push(req.query.end_date); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = all(query, params);
    const total = get(countQuery, countParams);
    res.json({ logs, pagination: { page, limit, total: total?.total || 0, pages: Math.ceil((total?.total || 0) / limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/recent', auth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = all(`SELECT * FROM api_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, [req.user.id, limit]);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = run('DELETE FROM api_logs WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Log not found' });
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
