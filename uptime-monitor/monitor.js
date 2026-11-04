const cron = require('node-cron');
const db = require('./db');

// Check one site and save the result
async function checkSite(site) {
  const start = Date.now();

  try {
    const response = await fetch(site.url, {
      signal: AbortSignal.timeout(10000), // give up after 10 seconds
    });
    const responseTime = Date.now() - start;
    const status = response.ok ? 'up' : 'down';

    db.saveCheck(site.id, status, response.status, responseTime);
    console.log(`${site.name}: ${status} (${response.status}, ${responseTime}ms)`);
  } catch (error) {
    // network error, bad domain, or timeout
    const responseTime = Date.now() - start;
    db.saveCheck(site.id, 'down', null, responseTime);
    console.log(`${site.name}: down (${error.name})`);
  }
}

// Check every saved site at the same time
async function checkAllSites() {
  const sites = db.getSites();
  await Promise.all(sites.map(checkSite));
}

function startMonitor() {
  cron.schedule('* * * * *', checkAllSites); // every minute
  checkAllSites(); // also run once right now
}

module.exports = { startMonitor };