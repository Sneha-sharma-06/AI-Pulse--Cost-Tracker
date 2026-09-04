const express = require('express');
const router = express.Router();
const { all, get } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.get('/csv', auth, (req, res) => {
  try {
    let query = 'SELECT * FROM api_logs WHERE user_id = ?';
    const params = [req.user.id];
    if (req.query.start_date) { query += ' AND created_at >= ?'; params.push(req.query.start_date); }
    if (req.query.end_date) { query += ' AND created_at <= ?'; params.push(req.query.end_date); }
    if (req.query.model) { query += ' AND model = ?'; params.push(req.query.model); }
    if (req.query.provider) { query += ' AND provider = ?'; params.push(req.query.provider); }
    if (req.query.project_id) { query += ' AND project_id = ?'; params.push(req.query.project_id); }
    query += ' ORDER BY created_at DESC';
    const logs = all(query, params);
    const csvHeader = 'ID,Date,Model,Provider,Endpoint,Prompt Tokens,Completion Tokens,Total Tokens,Cost,Latency,Status\n';
    const csvRows = logs.map(log => `${log.id},"${log.created_at}","${log.model}","${log.provider}","${log.endpoint}",${log.prompt_tokens},${log.completion_tokens},${log.total_tokens},${log.total_cost},${log.latency_ms},"${log.status}"`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ai-cost-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/summary', auth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const totalStats = get(`SELECT COUNT(*) as total_calls, COALESCE(SUM(total_cost), 0) as total_cost, COALESCE(SUM(total_tokens), 0) as total_tokens, COALESCE(AVG(latency_ms), 0) as avg_latency, COALESCE(AVG(total_cost), 0) as avg_cost_per_call, MIN(created_at) as first_call, MAX(created_at) as last_call FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days')`, [req.user.id, days]);
    const byModel = all(`SELECT model, COUNT(*) as calls, SUM(total_cost) as cost, SUM(total_tokens) as tokens, AVG(latency_ms) as avg_latency FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY model ORDER BY cost DESC`, [req.user.id, days]);
    const byProvider = all(`SELECT provider, COUNT(*) as calls, SUM(total_cost) as cost, SUM(total_tokens) as tokens FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY provider ORDER BY cost DESC`, [req.user.id, days]);
    const byStatus = all(`SELECT status, COUNT(*) as count FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY status`, [req.user.id, days]);
    const dailyTrend = all(`SELECT DATE(created_at) as date, SUM(total_cost) as cost, COUNT(*) as calls FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY DATE(created_at) ORDER BY date ASC`, [req.user.id, days]);
    const topEndpoints = all(`SELECT endpoint, COUNT(*) as calls, AVG(total_cost) as avg_cost, AVG(latency_ms) as avg_latency FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') AND endpoint IS NOT NULL GROUP BY endpoint ORDER BY calls DESC LIMIT 10`, [req.user.id, days]);
    res.json({ period: { days, from: new Date(Date.now() - days * 86400000).toISOString(), to: new Date().toISOString() }, overview: totalStats, byModel, byProvider, byStatus, dailyTrend, topEndpoints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
