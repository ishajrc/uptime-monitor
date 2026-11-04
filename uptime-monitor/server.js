const express = require('express');
const app = express();
const PORT = 3000;

// Lets the server read JSON sent by the browser
app.use(express.json());

// Temporary storage (replaced by a database in Step 3)
let sites = [];
let nextId = 1;

// Home route
app.get('/', (req, res) => {
  res.send('Uptime monitor is running!');
});

// GET all sites
app.get('/api/sites', (req, res) => {
  res.json(sites);
});

// POST: add a new site
app.post('/api/sites', (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'name and url are required' });
  }

  const site = { id: nextId++, name, url };
  sites.push(site);
  res.status(201).json(site);
});

// DELETE: remove a site by id
app.delete('/api/sites/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = sites.findIndex((site) => site.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Site not found' });
  }

  sites.splice(index, 1);
  res.json({ message: 'Site deleted' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});