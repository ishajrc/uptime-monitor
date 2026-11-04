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

// Uptime percentage over the last N hours (null if there is no data yet)
function getUptime(siteId, hours) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS up_count
       FROM checks
       WHERE site_id = ? AND checked_at >= datetime('now', ?)`
    )
    .get(siteId, `-${hours} hours`);

  if (!row.total) return null;
  return Math.round((row.up_count / row.total) * 1000) / 10; // one decimal place
}

// Safe-to-share data for the public status page
function getPublicStatus() {
  return getStatusOverview().map((site) => ({
    name: site.name,
    status: site.status,
    response_time_ms: site.response_time_ms,
    checked_at: site.checked_at,
    uptime_24h: getUptime(site.id, 24),
    uptime_7d: getUptime(site.id, 168),
    history: getChecks(site.id, 30)
      .reverse()
      .map((check) => check.status),
  }));
}

module.exports = {
  getSites,
  addSite,
  deleteSite,
  saveCheck,
  getChecks,
  getStatusOverview,
  getUptime,
  getPublicStatus,
};