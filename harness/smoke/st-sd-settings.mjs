import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
for (const [w, h, tag, mobile] of [[800, 1100, 'tab', true], [390, 844, 'phone', true]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && document.querySelector('#story_director_settings'), null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => localStorage.removeItem('story_director_settings_open_groups'));
  await page.locator('#extensions-settings-button .drawer-icon').first().tap();
  await page.waitForTimeout(700);
  await page.evaluate(() => { document.querySelector('#story_director_settings .inline-drawer-toggle').click(); });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('#story_director_settings').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${S}/shots/sd-settings-${tag}.png` });
  await page.close();
}
await browser.close();
