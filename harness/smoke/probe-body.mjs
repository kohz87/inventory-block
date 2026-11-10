import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await p.goto(process.env.ST_URL, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
await p.waitForTimeout(2000);
console.log(await p.evaluate(() => { const s = getComputedStyle(document.body); const h = getComputedStyle(document.documentElement); return JSON.stringify({ bt: s.transform, bf: s.filter, bbf: s.backdropFilter, bh: s.height, bpos: s.position, bcont: s.contain, ht: h.transform, hh: h.height, wt: s.willChange, sheet: getComputedStyle(document.querySelector('#story_suite_v2_panel')).bottom }); }));
await browser.close();
