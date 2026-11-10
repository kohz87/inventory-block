import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.argv[2];
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end('<!doctype html><body></body>'); } try { const d = fs.readFileSync(p); res.setHeader('content-type', 'text/javascript'); res.end(d); } catch { res.statusCode = 404; res.end(); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(); const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const out = await page.evaluate(async () => {
  const tpl = await import('/src/v2/view/template/index.js');
  const { conditionEvaluator } = await import('/src/v2/view/bind.js'); const cond = await import('/src/v2/events/condition.js');
  const EV = conditionEvaluator({ compile: cond.compile, evaluate: cond.evaluate });
  const compiled = tpl.compileTemplate('<form data-submit="shop.buy"><input type="checkbox" id="gift" data-draft="gift"><label for="gift">Gift wrap</label><input type="radio" name="size" value="s" data-draft="size"><input type="radio" name="size" value="l" data-draft="size"><button>Buy</button></form><div><input type="radio" name="tip" value="1" data-draft="tip"><input type="radio" name="tip" value="2" data-draft="tip"></div>');
  const views = [], calls = [];
  for (const i of [0, 1]) { const el = document.createElement('div'); document.body.appendChild(el); views.push({ el, view: tpl.renderTemplate(el, compiled, { draft: {}, screenId: 'shop-card' }, { evaluate: EV, screenId: 'shop-card', command: async (t, p) => { calls.push([i, t, p]); return { ok: true }; } }) }); }
  // click the label in the second (newest) instance
  views[1].el.querySelector('label').click();
  // pick tip 2 in the first instance, then tip 1 in the second
  views[0].el.querySelectorAll('input[type=radio]')[3].click();
  views[1].el.querySelectorAll('input[type=radio]')[2].click();
  views[1].el.querySelector('button').click();
  await new Promise(r => setTimeout(r, 20));
  return {
    ids: [...document.querySelectorAll('[id]')].map(e => e.id),
    giftChecked: views.map(v => v.el.querySelector('input[type=checkbox]').checked),
    drafts: views.map(v => JSON.stringify(v.view.draft())),
    tipChecked: views.map(v => [...v.el.querySelectorAll('input[type=radio]')].slice(2).map(r => r.checked)),
    calls: JSON.stringify(calls),
  };
});
console.log(out); await browser.close(); server.close();
