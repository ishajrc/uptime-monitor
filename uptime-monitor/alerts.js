async function sendAlert(message) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('No DISCORD_WEBHOOK_URL set, skipping alert');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
  } catch (error) {
    // a failed alert must never crash the monitor
    console.log('Failed to send alert:', error.message);
  }
}

module.exports = { sendAlert };