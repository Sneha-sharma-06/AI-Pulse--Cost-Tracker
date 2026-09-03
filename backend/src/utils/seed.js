const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { initDatabase, saveDatabase } = require('../../config/database');
const { initializeDatabase } = require('../models/schema');
const { get, exec } = require('./dbHelper');

const resetDatabase = async () => {
  await initDatabase();
  initializeDatabase();

  exec('DELETE FROM api_logs');
  exec('DELETE FROM team_members');
  exec('DELETE FROM teams');
  exec('DELETE FROM users');

  console.log('Database reset successfully. All data cleared.');
  console.log('Register a new account to get started.');
};

resetDatabase().catch(console.error);
