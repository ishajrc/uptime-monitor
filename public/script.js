const sitesDiv = document.getElementById('sites');
const summary = document.getElementById('summary');
const form = document.getElementById('add-form');

// SQLite stores times in UTC, so convert to the viewer's local time
function formatTime(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T') + 'Z');
  return date.toLocaleTimeString();
}

async function loadStatus() {
  const response = await fetch('/api/status');
  const sites = await response.json();

  sitesDiv.innerHTML = '';

  const upCount = sites.filter((site) => site.status === 'up').length;
  summary.textContent = sites.length
    ? `${upCount} of ${sites.length} sites are up`
    : 'No sites yet. Add one above.';

  sites.forEach((site) => {
    const card = document.createElement('div');
    card.className = `card ${site.status || ''}`;

    const info = document.createElement('div');

    const title = document.createElement('h3');
    title.textContent = site.name;

    const link = document.createElement('small');
    link.textContent = site.url;

    const details = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = 'badge';

    if (site.status) {
      badge.textContent = site.status;
      const extra = document.createElement('small');
      extra.textContent = ` · ${site.response_time_ms}ms · checked ${formatTime(site.checked_at)}`;
      details.append(badge, extra);
    } else {
      badge.textContent = 'waiting for first check';
      details.append(badge);
    }

    info.append(title, link, details);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      await fetch(`/api/sites/${site.id}`, { method: 'DELETE' });
      loadStatus();
    });

    card.append(info, deleteBtn);
    sitesDiv.append(card);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the page from reloading

  const name = document.getElementById('name').value;
  const url = document.getElementById('url').value;

  await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, url }),
  });

  form.reset();
  loadStatus();
});

loadStatus();
setInterval(loadStatus, 10000); // refresh every 10 seconds