// Playwright: render template forms whose controls use form-property names, in real Chromium.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.argv[2];
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><body></body>'); }
  try { const data = fs.readFileSync(p); res.setHeader('content-type', p.endsWith('.js') ? 'text/javascript' : 'text/plain'); res.end(data); } catch { res.statusCode = 404; res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://127.0.0.1:${port}/`); if (process.env.TPL) await page.evaluate(t => { globalThis.TPL = t; }, process.env.TPL);
const names = (process.argv[3] ?? 'classList,addEventListener,elements,submit,reset,action,method,id,length,name,appendChild,setAttribute,removeAttribute,disabled,remove,style,textContent,ownerDocument').split(',');
const out = await page.evaluate(async names => {
  const tpl = await import('/src/v2/view/template/index.js'); const { conditionEvaluator } = await import('/src/v2/view/bind.js'); const cond = await import('/src/v2/events/condition.js'); const EV = conditionEvaluator({ compile: cond.compile, evaluate: cond.evaluate });
  const results = {};
  for (const n of names) {
    const r = { };
    const el = document.createElement('div'); document.body.appendChild(el);
    const calls = [];
    try {
      const compiled = tpl.compileTemplate((globalThis.TPL ?? `<form data-submit="party.create"><input name="${n}" data-draft="pick"><button type="submit">Go</button></form>`).replaceAll("NAME", n));
      r.warnings = compiled.warnings;
      const view = tpl.renderTemplate(el, compiled, { draft: { pick: 'a' }, q: { list: [1,2] } }, { evaluate: EV, onWarn: m => (r.warn ??= []).push(m), command: async (t, p) => { calls.push([t, p]); return { ok: true }; } });
      r.rendered = el.innerHTML.slice(0, 200);
      const form = el.querySelector('form');
      try { form.querySelector('button').click(); } catch (e) { r.clickError = e.message; }
      await new Promise(res => setTimeout(res, 20));
      r.calls1 = JSON.stringify(calls);
      try { form.querySelector('button').click(); } catch (e) { r.clickError2 = e.message; }
      await new Promise(res => setTimeout(res, 20));
      r.calls2 = calls.length;
      r.busyClass = form.getAttribute('class'); r.ariaBusy = form.getAttribute('aria-busy');
      try { tpl.renderTemplate(el, compiled, { draft: { pick: 'b' }, q: { list: [3,1,2,4] } }, { evaluate: EV, command: async () => ({ ok: true }) }); r.updated = el.innerHTML.slice(0, 300); } catch (e) { r.updateError = e.message; }
      try { view.destroy?.(); r.afterDestroy = el.children.length; } catch (e) { r.destroyError = e.message; }
    } catch (e) { r.renderError = e.message; }
    results[n] = r;
  }
  return results;
}, names);
for (const [n, r] of Object.entries(out)) console.log(n.padEnd(18), JSON.stringify(r));
await browser.close(); server.close();
