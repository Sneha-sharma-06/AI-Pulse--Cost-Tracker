const express = require('express');
const router = express.Router();
const { all, get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

// Get audit logs
router.get('/', auth, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action;

    let query = 'SELECT al.*, u.username FROM audit_logs al JOIN users u ON al.user_id = u.id WHERE al.user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE user_id = ?';
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (action) {
      query += ' AND al.action = ?';
      countQuery += ' AND action = ?';
      params.push(action);
      countParams.push(action);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = all(query, params);
    const total = get(countQuery, countParams);

    res.json({
      logs,
      pagination: { page, limit, total: total?.total || 0, pages: Math.ceil((total?.total || 0) / limit) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create audit log (internal helper)
const createAuditLog = (userId, action, resourceType, resourceId, details, ipAddress) => {
  run('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, action, resourceType, resourceId, details, ipAddress]);
};

module.exports = router;
module.exports.createAuditLog = createAuditLog;
