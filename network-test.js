const net = require('net');
const https = require('https');

async function testTCP(host, port) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(3000);
    s.on('connect', () => { s.end(); resolve({ host, port, ok: true }); });
    s.on('timeout', () => { s.destroy(); resolve({ host, port, ok: false, err: 'timeout' }); });
    s.on('error', (e) => { s.destroy(); resolve({ host, port, ok: false, err: e.message }); });
    s.connect(port, host);
  });
}

async function testHTTPS(host) {
  return new Promise((resolve) => {
    const req = https.get('https://' + host, (res) => {
      res.resume();
      resolve({ host, ok: true, status: res.statusCode });
    });
    req.setTimeout(5000);
    req.on('timeout', () => { req.destroy(); resolve({ host, ok: false, err: 'timeout' }); });
    req.on('error', (e) => { resolve({ host, ok: false, err: e.message }); });
  });
}

async function main() {
  const tests = [
    testTCP('smtp.zoho.com', 465),
    testTCP('smtp.zoho.com', 587),
    testTCP('smtp.zoho.com', 2525),
    testTCP('google.com', 80),
    testTCP('google.com', 443),
    testHTTPS('google.com'),
    testHTTPS('smtp.zoho.com'),
    testHTTPS('meu-voto.app'),
  ];

  const results = await Promise.all(tests);
  results.forEach(r => {
    console.log(r.ok ? `✅ ${r.host}:${r.port || ''} OK` : `❌ ${r.host}:${r.port || ''} ${r.err}`);
  });
}

main().catch(e => console.error(e));