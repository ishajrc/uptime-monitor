const Database = require('better-sqlite3');

const db = new Database('monitor.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    checked_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function getSites() {
  return db.prepare('SELECT * FROM sites').all();
}

function addSite(name, url) {
  const result = db
    .prepare('INSERT INTO sites (name, url) VALUES (?, ?)')
    .run(name, url);
  return { id: result.lastInsertRowid, name, url };
}

function deleteSite(id) {
  // remove the site's check history first
  db.prepare('DELETE FROM checks WHERE site_id = ?').run(id);
  const result = db.prepare('DELETE FROM sites WHERE id = ?').run(id);
  return result.changes > 0;
}

function saveCheck(siteId, status, statusCode, responseTimeMs) {
  db.prepare(
    'INSERT INTO checks (site_id, status, status_code, response_time_ms) VALUES (?, ?, ?, ?)'
  ).run(siteId, status, statusCode, responseTimeMs);
}

function getChecks(siteId, limit = 50) {
  return db
    .prepare('SELECT * FROM checks WHERE site_id = ? ORDER BY id DESC LIMIT ?')
    .all(siteId, limit);
}

// Each site with its most recent check
function getStatusOverview() {
  return db
    .prepare(
      `SELECT s.id, s.name, s.url,
              c.status, c.status_code, c.response_time_ms, c.checked_at
       FROM sites s
       LEFT JOIN checks c
         ON c.id = (SELECT id FROM checks WHERE site_id = s.id ORDER BY id DESC LIMIT 1)`
    )
    .all();
}

module.exports = {
  getSites,
  addSite,
  deleteSite,
  saveCheck,
  getChecks,
  getStatusOverview,
};