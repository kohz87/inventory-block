import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const tag = process.argv[2] ?? 'before';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(4000);
await page.locator('#extensions-settings-button .drawer-toggle').click(); await page.waitForTimeout(800);
for (const id of ['story_block_settings', 'rpg_battle_settings']) {
  const box = page.locator(`#${id}`);
  await box.locator('.inline-drawer-toggle').first().click().catch(e => console.log('toggle', id, e.message)); await page.waitForTimeout(600);
  const h = await box.evaluate(n => n.getBoundingClientRect().height);
  console.log(id, 'height', Math.round(h));
  await box.screenshot({ path: `${S}/shots/settings-${id}-${tag}.png` }).catch(e => console.log('shot', e.message));
  await box.locator('.inline-drawer-toggle').first().click().catch(() => {}); await page.waitForTimeout(300);
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
