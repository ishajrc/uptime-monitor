const Database = require('better-sqlite3');

// Opens the database file (creates it if it doesn't exist)
const db = new Database('monitor.db');

// Create the sites table the first time
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL
  )
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
  const result = db.prepare('DELETE FROM sites WHERE id = ?').run(id);
  return result.changes > 0; // true if something was deleted
}

module.exports = { getSites, addSite, deleteSite };