require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./db');
const { startMonitor } = require('./monitor');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Password protection for admin features
function requireAdmin(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return next(); // no password set: local development

  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString();
    const given = decoded.slice(decoded.indexOf(':') + 1);
    if (given === password) return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Uptime Monitor Admin"');
  res.status(401).send('Authentication required');
}

// Lightweight route for keep-alive pings
app.get('/health', (req, res) => {
  res.send('ok');
});

// Admin dashboard (password protected)
app.get(['/', '/index.html'], requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(['/api/sites', '/api/status'], requireAdmin);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/sites', (req, res) => {
  res.json(db.getSites());
});

app.post('/api/sites', (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'name and url are required' });
  }

  const site = db.addSite(name, url);
  res.status(201).json(site);
});

app.delete('/api/sites/:id', (req, res) => {
  const deleted = db.deleteSite(Number(req.params.id));

  if (!deleted) {
    return res.status(404).json({ error: 'Site not found' });
  }

  res.json({ message: 'Site deleted' });
});

app.get('/api/sites/:id/checks', (req, res) => {
  res.json(db.getChecks(Number(req.params.id)));
});

app.get('/api/status', (req, res) => {
  res.json(db.getStatusOverview());
});

// Public (no password, no internal URLs or ids)
app.get('/api/public-status', (req, res) => {
  res.json(db.getPublicStatus());
});

app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

// Free hosting wipes the database on restart, so re-add demo sites if empty
function seedDemoSites() {
  if (db.getSites().length === 0) {
    db.addSite('GitHub', 'https://github.com');
    db.addSite('Wikipedia', 'https://www.wikipedia.org');
    db.addSite('Google', 'https://www.google.com');
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  seedDemoSites();
  startMonitor();
});