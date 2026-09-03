const { getDb, saveDatabase } = require('../../config/database');

const all = (sql, params = []) => {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
};

const get = (sql, params = []) => {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let result = null;
  if (stmt.step()) result = stmt.getAsObject();
  stmt.free();
  return result;
};

const run = (sql, params = []) => {
  const db = getDb();
  db.run(sql, params);
  const lastId = get('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: lastId?.id, changes: db.getRowsModified() };
};

const exec = (sql) => {
  const db = getDb();
  db.exec(sql);
};

module.exports = { all, get, run, exec, saveDatabase };
