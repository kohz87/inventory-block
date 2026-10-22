import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await b.newPage(); await p.goto('http://127.0.0.1:8301/', { waitUntil: 'domcontentloaded' });
for (const [n, s] of [['ascii 50k', 'a'.repeat(50000)], ['cjk 30k units / 90KB', '雨'.repeat(30000)], ['cjk 20k units / 60KB', '雨'.repeat(20000)]])
  console.log(n, await p.evaluate(async t => { try { const r = await fetch('/version', { method: 'POST', body: t, keepalive: true }); return 'sent ' + r.status; } catch (e) { return 'REJECTED ' + e.name + ': ' + e.message; } }, s));
await b.close();
