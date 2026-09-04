const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const isVercel = !!process.env.VERCEL;
const dataDir = isVercel ? '/tmp' : path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

if (!isVercel && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

const initDatabase = async () => {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
};

const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

module.exports = { initDatabase, getDb: () => db, saveDatabase };
