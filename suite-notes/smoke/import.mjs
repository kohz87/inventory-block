// Installs the Ersveil pack through Story Block's own "Import pack file" input (packs.install, the path players use).
import { createRequire } from 'node:module';
import { connect, openChat } from './create.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright');
const pack = process.argv[2] ?? '/home/user/st-smoke/data/default-user/extensions/Story_block/examples/packs/ersveil-bluewatch/pack.json';
const browser = await chromium.launch(); const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
await page.goto(process.env.ST_URL ?? 'http://127.0.0.1:8150/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 });
await page.waitForTimeout(5000);
await connect(page);
await openChat(page);
// The pack panel is drawn inside Story Block's settings: Suite → Tabs & Packs.
const steps = [];
for (const name of ['Suite', /Tabs\s*&(amp;)?\s*Packs/]) {
    const b = page.getByText(name, typeof name === 'string' ? { exact: true } : undefined);
    let clicked = false;
    for (let n = 0; n < await b.count() && !clicked; n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); clicked = true; }
    steps.push(`${name}: ${clicked}`);
    await page.waitForTimeout(1500);
}
await page.screenshot({ path: '/home/user/st-smoke/import-panel.png' });
const input = page.locator('input.ss-packs-file').first();
const found = await input.count();
if (found) {
    await input.setInputFiles(pack);
    await page.waitForTimeout(3000);
}
const out = await page.evaluate(() => ({
    message: document.querySelector('.ss-packs-message')?.textContent ?? null,
    errors: [...document.querySelectorAll('.ss-packs-errors li')].map(li => li.textContent),
    selection: (() => { try { return StoryBlock.sdk.query('rules.selection', {}); } catch (e) { return 'err ' + e.message; } })(),
    version: StoryBlock.version,
}));
console.log(JSON.stringify({ steps, found, ...out, pageErrors: errors }, null, 1));
await browser.close();
