const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { all, get, run } = require('../utils/dbHelper');
const auth = require('../middleware/auth');

// Generate API key
const generateApiKey = () => {
  const prefix = 'aip_';
  const key = crypto.randomBytes(32).toString('hex');
  return { fullKey: prefix + key, prefix: prefix + key.substring(0, 8), hash: crypto.createHash('sha256').update(key).digest('hex') };
};

// Get user's API keys
router.get('/', auth, (req, res) => {
  try {
    const keys = all(`
      SELECT id, provider, name, key_prefix, is_active, monthly_limit, current_usage, last_used_at, created_at
      FROM api_keys WHERE user_id = ? ORDER BY created_at DESC
    `, [req.user.id]);
    res.json(keys);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create API key
router.post('/', auth, (req, res) => {
  try {
    const { provider, name, monthly_limit } = req.body;
    const { fullKey, prefix, hash } = generateApiKey();

    const result = run(
      'INSERT INTO api_keys (user_id, team_id, provider, name, key_hash, key_prefix, monthly_limit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, null, provider, name, hash, prefix, monthly_limit]
    );

    // Log audit
    run('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create', 'api_key', result.lastInsertRowid, `Created ${provider} API key: ${name}`]);

    res.status(201).json({
      id: result.lastInsertRowid,
      key: fullKey,
      provider,
      name,
      message: 'Save this key - it won\'t be shown again'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle API key
router.put('/:id/toggle', auth, (req, res) => {
  try {
    const key = get('SELECT * FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!key) return res.status(404).json({ error: 'Key not found' });

    run('UPDATE api_keys SET is_active = ? WHERE id = ?', [key.is_active ? 0 : 1, req.params.id]);
    res.json({ message: key.is_active ? 'Key deactivated' : 'Key activated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete API key
router.delete('/:id', auth, (req, res) => {
  try {
    run('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    run('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete', 'api_key', req.params.id, 'Deleted API key']);
    res.json({ message: 'Key deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update API key usage (called internally)
router.post('/:id/usage', auth, (req, res) => {
  try {
    const { cost } = req.body;
    run('UPDATE api_keys SET current_usage = current_usage + ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [cost, req.params.id]);
    res.json({ message: 'Usage updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
