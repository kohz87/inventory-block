import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.argv[2];
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><body></body>'); } try { const d = fs.readFileSync(p); res.setHeader('content-type', 'text/javascript'); res.end(d); } catch { res.statusCode = 404; res.end(); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(); const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const out = await page.evaluate(async () => {
  const tpl = await import('/src/v2/view/template/index.js'); const { scopeCss } = await import('/src/v2/view/css.js');
  const r = {};
  for (const n of [1000, 3000, 5000, 12000]) { try { tpl.compileTemplate('<div>'.repeat(n) + 'x'); r['tpl' + n] = 'ok'; } catch (e) { r['tpl' + n] = e.message; } }
  const t = performance.now(); scopeCss('@media (min-width: 1px) {'.repeat(1000) + '.a{color:red}' + '}'.repeat(1000), 'x'); r.css1000ms = Math.round(performance.now() - t);
  return r;
});
console.log(out); await browser.close(); server.close();
