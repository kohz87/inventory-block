import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror ' + e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && typeof window.rpgBattleInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(2500);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:rpg-battle"]')?.click()); await page.waitForTimeout(400);
const mode = await page.evaluate(() => document.querySelector('.rpg-battle-tab')?.dataset.mode);
if (mode === 'result') { await page.evaluate(() => document.querySelector('.rpg-battle-done')?.click()); await page.waitForTimeout(400); }
console.log('before:', await page.evaluate(() => window.StoryBlock.getBlock('Character')?.text.split('\n')[2]));
await page.evaluate(() => document.querySelector('.rpg-battle-start')?.click()); await page.waitForTimeout(400);
console.log('start while down → mode', await page.evaluate(() => document.querySelector('.rpg-battle-tab')?.dataset.mode), await page.evaluate(() => document.querySelector('#toast-container')?.innerText));
await page.evaluate(() => document.querySelector('.rpg-battle-rest')?.click()); await page.waitForTimeout(1200);
console.log('after rest:', await page.evaluate(() => window.StoryBlock.getBlock('Character')?.text.split('\n')[2]));
await browser.close();
