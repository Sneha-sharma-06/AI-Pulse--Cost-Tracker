const { getDb, saveDatabase } = require('../../config/database');

const initializeDatabase = () => {
  const db = getDb();

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      avatar_color TEXT DEFAULT '#0ea5e9',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Teams table
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      budget_limit DECIMAL(10,2) DEFAULT 1000.00,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // Team members with roles
  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER,
      user_id INTEGER,
      role TEXT DEFAULT 'member',
      invited_by INTEGER,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (invited_by) REFERENCES users(id)
    )
  `);

  // API Keys management
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      team_id INTEGER,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      monthly_limit DECIMAL(10,2),
      current_usage DECIMAL(10,2) DEFAULT 0,
      last_used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `);

  // Projects for cost allocation
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      team_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      budget_limit DECIMAL(10,2),
      color TEXT DEFAULT '#0ea5e9',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `);

  // API Logs with project tagging
  db.run(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      team_id INTEGER,
      project_id INTEGER,
      api_key_id INTEGER,
      model TEXT NOT NULL,
      provider TEXT NOT NULL,
      endpoint TEXT,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      total_cost DECIMAL(10,6) DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'success',
      tags TEXT,
      request_prompt TEXT,
      response_text TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    )
  `);

  // Budget alerts configuration
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      team_id INTEGER,
      project_id INTEGER,
      threshold_percent INTEGER DEFAULT 80,
      alert_type TEXT DEFAULT 'email',
      notify_users TEXT,
      is_active INTEGER DEFAULT 1,
      last_triggered DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Alert history
  db.run(`
    CREATE TABLE IF NOT EXISTS alert_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER,
      user_id INTEGER,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES budget_alerts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Audit logs
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Prompt templates for versioning
  db.run(`
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      project_id INTEGER,
      name TEXT NOT NULL,
      template TEXT NOT NULL,
      model TEXT,
      version INTEGER DEFAULT 1,
      avg_tokens INTEGER DEFAULT 0,
      avg_cost DECIMAL(10,6) DEFAULT 0,
      success_rate DECIMAL(5,2) DEFAULT 100.00,
      usage_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // User preferences
  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      theme TEXT DEFAULT 'dark',
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      email_notifications INTEGER DEFAULT 1,
      budget_alert_enabled INTEGER DEFAULT 1,
      default_date_range TEXT DEFAULT '30d',
      dashboard_layout TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_team_id ON api_logs(team_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_project_id ON api_logs(project_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_logs_model ON api_logs(model)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alert_history_user ON alert_history(user_id)`);

  saveDatabase();
  console.log('Database initialized with all tables');
};

module.exports = { initializeDatabase };
