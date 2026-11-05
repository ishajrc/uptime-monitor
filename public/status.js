const banner = document.getElementById('banner');
const services = document.getElementById('services');

let charts = []; // keep track of charts so we can remove old ones

function formatUptime(value) {
  return value === null ? 'no data yet' : `${value}%`;
}

// SQLite stores UTC, so convert to the viewer's local time
function formatTime(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T') + 'Z');
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function drawChart(canvas, points) {
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: points.map((point) => formatTime(point.checked_at)),
      datasets: [
        {
          label: 'Response time (ms)',
          data: points.map((point) => point.ms),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
          fill: true,
          spanGaps: false, // leave a gap where the site was down
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'ms' } },
        x: { ticks: { maxTicksLimit: 6 } },
      },
    },
  });

  charts.push(chart);
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

  // Remove old charts before rebuilding the page
  charts.forEach((chart) => chart.destroy());
  charts = [];
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

    // Chart (only if there is at least one successful check to plot)
    const hasData = site.response_times.some((point) => point.ms !== null);
    if (hasData) {
      const chartBox = document.createElement('div');
      chartBox.className = 'chart-box';
      const canvas = document.createElement('canvas');
      chartBox.append(canvas);
      box.append(chartBox);
      services.append(box);
      drawChart(canvas, site.response_times);
    } else {
      services.append(box);
    }
  });
}

loadStatus();
setInterval(loadStatus, 30000);