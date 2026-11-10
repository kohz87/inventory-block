import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.argv[2];
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><body></body>'); } try { const d = fs.readFileSync(p); res.setHeader('content-type', 'text/javascript'); res.end(d); } catch { res.statusCode = 404; res.end(); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(); const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/`);
for (const [n, depth] of [[30, 2], [30, 3], [60, 3], [1000, 2]]) {
  const out = await page.evaluate(async ([n, depth]) => {
    const tpl = await import('/src/v2/view/template/index.js');
    const { conditionEvaluator } = await import('/src/v2/view/bind.js'); const cond = await import('/src/v2/events/condition.js');
    const EV = conditionEvaluator({ compile: cond.compile, evaluate: cond.evaluate });
    const names = 'abcdefgh';
    let html = 'x';
    for (let d = depth - 1; d >= 0; d--) html = `<i data-each="q.list as ${names[d]}">${html}</i>`;
    const el = document.createElement('div'); document.body.replaceChildren(el);
    const t = performance.now();
    const c = tpl.compileTemplate(html);
    tpl.renderTemplate(el, c, { q: { list: Array.from({ length: n }, (_, i) => ({ id: 'r' + i })) } }, { evaluate: EV });
    const ms = Math.round(performance.now() - t);
    const t2 = performance.now();
    tpl.renderTemplate(el, c, { q: { list: Array.from({ length: n }, (_, i) => ({ id: 'r' + i, v: 1 })) } }, { evaluate: EV });
    return { len: html.length, nodes: el.getElementsByTagName('*').length, ms, rerenderMs: Math.round(performance.now() - t2) };
  }, [n, depth]);
  console.log(n, depth, out);
}
await browser.close(); server.close();
