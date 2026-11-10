import { createRequire } from 'node:module';
import { connect, openChat } from './create.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright');
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:8150/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 });
await page.waitForTimeout(5000); await connect(page); await openChat(page);
const q = await page.evaluate(() => { const r = (n, a = {}) => { try { return StoryBlock.sdk.query(n, a); } catch (e) { return 'err ' + e.message; } };
  return { offers: r('dataModules.offers'), setup: r('dataModules.setup'), modules: (StoryBlock.sdk.modules?.() ?? []).map(m => m.id + ':' + m.status), caps: (StoryBlock.sdk.modules?.() ?? []).flatMap(m => m.capabilities ?? []) }; });
const b = page.getByText('Suite', { exact: true }); for (let n = 0; n < await b.count(); n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); break; }
await page.waitForTimeout(1500); await page.getByText(/Tabs\s*&(amp;)?\s*Packs/).first().click(); await page.waitForTimeout(2000);
const dmCard = await page.evaluate(() => { const c = document.querySelector('.ss-dm-card'); return c ? { text: c.innerText.slice(0, 600), buttons: [...c.querySelectorAll('button')].map(b => b.innerText.trim()) } : null; }); await page.locator('.ss-dm-card').scrollIntoViewIfNeeded().catch(() => {});
await page.screenshot({ path: '/home/user/st-smoke/dm-probe.png', fullPage: false });
console.log(JSON.stringify({ offers: Array.isArray(q.offers) ? q.offers.length : q.offers, setup: JSON.stringify(q.setup).slice(0, 600), modules: q.modules, caps: q.caps, dmCard }, null, 1)); await browser.close();
