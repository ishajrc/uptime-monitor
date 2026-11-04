require('dotenv').config();
const express = require('express');
const db = require('./db');
const { startMonitor } = require('./monitor');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

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

// Check history for one site
app.get('/api/sites/:id/checks', (req, res) => {
  res.json(db.getChecks(Number(req.params.id)));
});

// Every site with its latest status
app.get('/api/status', (req, res) => {
  res.json(db.getStatusOverview());
});

// Public API: no URLs or internal ids
app.get('/api/public-status', (req, res) => {
  res.json(db.getPublicStatus());
});

// Public status page
app.get('/status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'status.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startMonitor();
});