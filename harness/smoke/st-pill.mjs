import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StorySuite?.api('story-block')?.openSuite, null, { timeout: 60000 });
await page.waitForTimeout(4000);
await page.evaluate(() => window.StorySuite.api('story-block').openSuite('story-block')); await page.waitForTimeout(800);
// toggle one block off and back to see both states
const before = await page.evaluate(() => document.querySelectorAll('.story-block-switch input:checked').length);
await page.locator('.story-block-switch').nth(1).click(); await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/shots/sb-pill.png' });
const after = await page.evaluate(() => document.querySelectorAll('.story-block-switch input:checked').length);
await page.locator('.story-block-switch').nth(1).click(); await page.waitForTimeout(600);
console.log('checked before/after toggle/restored:', before, after, await page.evaluate(() => document.querySelectorAll('.story-block-switch input:checked').length));
await browser.close();
