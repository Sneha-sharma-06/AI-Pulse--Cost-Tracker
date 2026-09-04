const express = require('express');
const router = express.Router();
const { all, get } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

router.get('/prompt-efficiency', auth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const efficiency = all(`SELECT endpoint, AVG(prompt_tokens) as avg_prompt_tokens, AVG(completion_tokens) as avg_completion_tokens, AVG(total_tokens) as avg_total_tokens, AVG(total_cost) as avg_cost, AVG(latency_ms) as avg_latency, COUNT(*) as usage_count FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') AND endpoint IS NOT NULL GROUP BY endpoint ORDER BY usage_count DESC LIMIT 10`, [req.user.id, days]);
    res.json(efficiency);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/forecast', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const recentAvg = get(`SELECT AVG(daily_cost) as avg_daily_cost, AVG(daily_tokens) as avg_daily_tokens FROM (SELECT DATE(created_at) as day, SUM(total_cost) as daily_cost, SUM(total_tokens) as daily_tokens FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-7 days') GROUP BY DATE(created_at))`, [userId]);
    const week1Cost = get(`SELECT COALESCE(SUM(total_cost), 0) as cost FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')`, [userId]);
    const week2Cost = get(`SELECT COALESCE(SUM(total_cost), 0) as cost FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-7 days')`, [userId]);
    const growthRate = week1Cost.cost > 0 ? (week2Cost.cost / week1Cost.cost) : 1;
    const avgDailyCost = recentAvg.avg_daily_cost || 0;
    const forecast = [];
    let projectedCost = 0;
    for (let i = 1; i <= 30; i++) {
      const dayCost = avgDailyCost * Math.pow(growthRate, i / 7);
      projectedCost += dayCost;
      forecast.push({ day: i, date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0], projected_cost: parseFloat(dayCost.toFixed(4)), cumulative_cost: parseFloat(projectedCost.toFixed(4)) });
    }
    res.json({ current_avg_daily: parseFloat(avgDailyCost.toFixed(4)), growth_rate: parseFloat(growthRate.toFixed(2)), forecast_30_days: parseFloat(projectedCost.toFixed(2)), daily_forecast: forecast });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/model-comparison', auth, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const comparison = all(`SELECT model, COUNT(*) as total_calls, SUM(total_tokens) as total_tokens, SUM(total_cost) as total_cost, AVG(latency_ms) as avg_latency, AVG(total_cost / NULLIF(total_tokens, 0) * 1000) as cost_per_1k_tokens, CAST(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*) as success_rate FROM api_logs WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days') GROUP BY model ORDER BY total_calls DESC`, [req.user.id, days]);
    res.json(comparison);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
