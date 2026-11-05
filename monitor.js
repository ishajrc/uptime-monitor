const cron = require('node-cron');
const db = require('./db');
const { sendAlert } = require('./alerts');

// Send a message only when the status changed
async function notifyIfChanged(site, previous, status) {
  const before = previous ? previous.status : null;

  if (status === 'down' && before !== 'down') {
    await sendAlert(`🔴 **${site.name}** is DOWN (${site.url})`);
  } else if (status === 'up' && before === 'down') {
    await sendAlert(`🟢 **${site.name}** is back UP (${site.url})`);
  }
}

async function checkSite(site) {
  const start = Date.now();
  let status;
  let statusCode = null;

  try {
    const response = await fetch(site.url, {
      signal: AbortSignal.timeout(10000),
    });
    statusCode = response.status;
    status = response.ok ? 'up' : 'down';
  } catch (error) {
    status = 'down'; // network error, bad domain, or timeout
  }

  const responseTime = Date.now() - start;

  // read the previous result BEFORE saving the new one
  const previous = db.getChecks(site.id, 1)[0];

  db.saveCheck(site.id, status, statusCode, responseTime);
  console.log(`${site.name}: ${status} (${statusCode ?? 'no response'}, ${responseTime}ms)`);

  await notifyIfChanged(site, previous, status);
}

async function checkAllSites() {
  const sites = db.getSites();
  await Promise.all(sites.map(checkSite));
}

function startMonitor() {
  cron.schedule('* * * * *', checkAllSites);
  checkAllSites();
}

module.exports = { startMonitor };