const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../utils/dbHelper');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = run('INSERT INTO users (username, password, name) VALUES (?, ?, ?)', [username, hashedPassword, name]);
    const userId = result.lastInsertRowid;

    const teamResult = run('INSERT INTO teams (name, budget_limit, owner_id) VALUES (?, ?, ?)', [`${name}'s Team`, 2500, userId]);
    run('INSERT INTO team_members (team_id, user_id, role, invited_by) VALUES (?, ?, ?, ?)', [teamResult.lastInsertRowid, userId, 'owner', userId]);

    run('INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId, 'create', 'user', userId, `Account created: ${username}`]);

    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created',
      token,
      user: { id: userId, username, name, role: 'user', created_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Wrong password' });
    }

    run('INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
      [user.id, 'login', 'user', `Logged in from browser`]);

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in',
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role, created_at: user.created_at }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), (req, res) => {
  const user = get('SELECT id, username, name, role, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

module.exports = router;
