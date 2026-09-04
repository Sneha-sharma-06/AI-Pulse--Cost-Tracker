const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const IS_VERCEL = !!process.env.VERCEL;
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');

let db = null;

const initDatabase = async () => {
  if (db) return db;
  const SQL = await initSqlJs();
  if (!IS_VERCEL && fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
};

const saveDatabase = () => {
  if (db && !IS_VERCEL) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, buffer);
  }
};

module.exports = { initDatabase, getDb: () => db, saveDatabase };
