import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const errors = [];
for (const [name, vp] of [['desk', { width: 1280, height: 1000 }], ['phone', { width: 390, height: 900 }]]) {
  const page = await browser.newPage({ viewport: vp, isMobile: name === 'phone', hasTouch: name === 'phone' });
  page.on('pageerror', e => errors.push(name + ' pageerror ' + e.message));
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.StorySuite?.api('story-block')?.openSuite, null, { timeout: 60000 });
  await page.waitForTimeout(4500);
  // Each extension's panel, as the overlay shows it (same markup as in the drawer).
  await page.evaluate(() => window.StorySuite.api('story-block').openSuite('overview')); await page.waitForTimeout(800);
  // open token fold for the shot
  await page.evaluate(() => { for (const d of document.querySelectorAll('.story-suite-overlay details.story-suite-fold')) d.open = true; }); await page.waitForTimeout(300);
  await page.screenshot({ path: `${S}/shots/r04-${name}-overview.png`, fullPage: false });
  console.log(name, 'overview:', (await page.evaluate(() => document.querySelector('.story-suite-pane')?.innerText.replace(/\s+/g, ' ').slice(0, 900))));
  for (const id of ['story-block', 'story-director', 'npc-state-delta', 'rpg-battle']) {
    await page.locator(`.story-suite-tab[data-tab-id="${id}"]`).click(); await page.waitForTimeout(700);
    await page.screenshot({ path: `${S}/shots/r04-${name}-${id}.png` });
  }
  await page.close();
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
