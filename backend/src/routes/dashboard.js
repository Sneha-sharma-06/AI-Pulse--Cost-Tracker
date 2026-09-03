const express = require('express');
const router = express.Router();
const { all, get } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

// Get dashboard overview stats
router.get('/stats', auth, (req, res) => {
  try {
    const userId = req.user.id;

    // Total cost today
    const todayCost = get(`
      SELECT COALESCE(SUM(total_cost), 0) as cost
      FROM api_logs
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [userId]);

    // Total cost this month
    const monthCost = get(`
      SELECT COALESCE(SUM(total_cost), 0) as cost
      FROM api_logs
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `, [userId]);

    // Total cost last month
    const lastMonthCost = get(`
      SELECT COALESCE(SUM(total_cost), 0) as cost
      FROM api_logs
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')
    `, [userId]);

    // Total tokens today
    const todayTokens = get(`
      SELECT COALESCE(SUM(total_tokens), 0) as tokens
      FROM api_logs
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [userId]);

    // Total tokens this month
    const monthTokens = get(`
      SELECT COALESCE(SUM(total_tokens), 0) as tokens
      FROM api_logs
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `, [userId]);

    // Total API calls today
    const todayCalls = get(`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [userId]);

    // Total API calls this month
    const monthCalls = get(`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `, [userId]);

    // Average latency
    const avgLatency = get(`
      SELECT COALESCE(AVG(latency_ms), 0) as latency
      FROM api_logs
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [userId]);

    // Success rate
    const successRate = get(`
      SELECT
        CAST(COUNT(CASE WHEN status = 'success' THEN 1 END) AS FLOAT) * 100.0 / COUNT(*) as rate
      FROM api_logs
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
    `, [userId]);

    // Calculate cost change percentage
    const costChange = lastMonthCost.cost > 0
      ? ((monthCost.cost - lastMonthCost.cost) / lastMonthCost.cost * 100).toFixed(1)
      : 0;

    res.json({
      todayCost: parseFloat(todayCost.cost || 0).toFixed(4),
      monthCost: parseFloat(monthCost.cost || 0).toFixed(2),
      costChange: parseFloat(costChange),
      todayTokens: todayTokens.tokens || 0,
      monthTokens: monthTokens.tokens || 0,
      todayCalls: todayCalls.count || 0,
      monthCalls: monthCalls.count || 0,
      avgLatency: Math.round(avgLatency.latency || 0),
      successRate: successRate.rate ? parseFloat(successRate.rate).toFixed(1) : 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cost by model
router.get('/cost-by-model', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const costByModel = all(`
      SELECT
        model,
        SUM(total_cost) as total_cost,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as call_count
      FROM api_logs
      WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY model
      ORDER BY total_cost DESC
    `, [userId, days]);

    res.json(costByModel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get cost by provider
router.get('/cost-by-provider', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const costByProvider = all(`
      SELECT
        provider,
        SUM(total_cost) as total_cost,
        SUM(total_tokens) as total_tokens,
        COUNT(*) as call_count
      FROM api_logs
      WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY provider
      ORDER BY total_cost DESC
    `, [userId, days]);

    res.json(costByProvider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get daily cost trend
router.get('/daily-trend', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const dailyTrend = all(`
      SELECT
        DATE(created_at) as date,
        SUM(total_cost) as cost,
        SUM(total_tokens) as tokens,
        COUNT(*) as calls
      FROM api_logs
      WHERE user_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [userId, days]);

    res.json(dailyTrend);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get hourly usage pattern
router.get('/hourly-pattern', auth, (req, res) => {
  try {
    const userId = req.user.id;

    const hourlyPattern = all(`
      SELECT
        strftime('%H', created_at) as hour,
        SUM(total_cost) as cost,
        COUNT(*) as calls
      FROM api_logs
      WHERE user_id = ? AND DATE(created_at) = DATE('now')
      GROUP BY strftime('%H', created_at)
      ORDER BY hour ASC
    `, [userId]);

    res.json(hourlyPattern);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
