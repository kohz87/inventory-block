import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const tag = process.argv[2] || 'before';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(1500);
// Content editor (Edit on the World tab).
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
await page.locator('button.story-block-sidebar-tab[data-tab-id="block:world-state"]').click(); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('#story_block_sidebar .story-block-edit, #story_block_sidebar [class*="edit"]')?.click());
await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/shots/sb-body-${tag}.png` });
console.log('body editor note length:', await page.evaluate(() => document.querySelector('.story-block-body-editor-note')?.textContent.length));
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.locator('#extensions-settings-button .drawer-icon').first().tap(); await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('.story-block-settings .inline-drawer-toggle').click()); await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('.story-block-row[data-block-id="world-state"] .story-block-edit')?.click()); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-editor')?.scrollIntoView());
for (let i = 0; i < 4; i++) {
  await page.screenshot({ path: `${S}/shots/sb-def-${tag}-${i}.png` });
  await page.evaluate(() => { const c = document.querySelector('#extensions_settings2')?.closest('.drawer-content') ?? document.scrollingElement; c.scrollBy(0, 700); });
  await page.waitForTimeout(200);
}
console.log('editor height', await page.evaluate(() => document.querySelector('.story-block-editor')?.getBoundingClientRect().height));
await browser.close();
