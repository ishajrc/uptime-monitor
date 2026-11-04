const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Uptime monitor is running!');
});

// GET all sites
app.get('/api/sites', (req, res) => {
  res.json(db.getSites());
});

// POST: add a new site
app.post('/api/sites', (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'name and url are required' });
  }

  const site = db.addSite(name, url);
  res.status(201).json(site);
});

// DELETE: remove a site by id
app.delete('/api/sites/:id', (req, res) => {
  const deleted = db.deleteSite(Number(req.params.id));

  if (!deleted) {
    return res.status(404).json({ error: 'Site not found' });
  }

  res.json({ message: 'Site deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});