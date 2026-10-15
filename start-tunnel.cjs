const localtunnel = require('localtunnel');

async function createTunnel() {
  try {
    console.log('Connecting to public tunnel server on port 5173...');
    const tunnel = await localtunnel({
      port: 5173,
      subdomain: 'pulse-hospital-live'
    });

    console.log('====================================================');
    console.log('  PULSE HMS IS LIVE ON THE INTERNET!');
    console.log('  PUBLIC URL: ' + tunnel.url);
    console.log('  PASSWORD / IP: 45.112.185.220');
    console.log('====================================================');

    tunnel.on('close', () => {
      console.log('Tunnel connection lost. Reconnecting in 3 seconds...');
      setTimeout(createTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err?.message || err);
    });
  } catch (err) {
    console.error('Failed to establish tunnel:', err?.message || err);
    console.log('Retrying in 5 seconds...');
    setTimeout(createTunnel, 5000);
  }
}

createTunnel();

// Keep event loop alive
setInterval(() => {}, 1000 * 60 * 60);
