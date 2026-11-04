const banner = document.getElementById('banner');
const services = document.getElementById('services');

function formatUptime(value) {
  return value === null ? 'no data yet' : `${value}%`;
}

async function loadStatus() {
  const response = await fetch('/api/public-status');
  const sites = await response.json();

  // Overall banner
  const downCount = sites.filter((site) => site.status === 'down').length;

  if (sites.length === 0) {
    banner.textContent = 'No services are being monitored yet';
    banner.className = 'banner';
  } else if (downCount === 0) {
    banner.textContent = 'All systems operational';
    banner.className = 'banner ok';
  } else {
    banner.textContent = `${downCount} of ${sites.length} services are down`;
    banner.className = 'banner issue';
  }

  // One block per service
  services.innerHTML = '';

  sites.forEach((site) => {
    const box = document.createElement('div');
    box.className = 'service';

    const top = document.createElement('div');
    top.className = 'service-top';

    const title = document.createElement('h3');
    title.textContent = site.name;

    const badge = document.createElement('span');
    badge.className = `badge ${site.status || ''}`;
    badge.textContent = site.status || 'pending';

    top.append(title, badge);

    // Row of small bars: one per recent check
    const history = document.createElement('div');
    history.className = 'history';
    site.history.forEach((status) => {
      const bar = document.createElement('div');
      bar.className = `bar ${status}`;
      history.append(bar);
    });

    const uptime = document.createElement('div');
    uptime.className = 'uptime';
    uptime.textContent = `Uptime: ${formatUptime(site.uptime_24h)} (24h) · ${formatUptime(site.uptime_7d)} (7 days)`;

    box.append(top, history, uptime);
    services.append(box);
  });
}

loadStatus();
setInterval(loadStatus, 30000); // refresh every 30 seconds