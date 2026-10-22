import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(4000);
console.log('characters:', await page.evaluate(() => SillyTavern.getContext().characters.map(c => c.name).join(', ')));
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); await ctx.executeSlashCommandsWithOptions('/newchat'); });
await page.waitForTimeout(3000);
const mode = await page.evaluate(() => document.querySelector('#story_block_sidebar')?.dataset.mode);
if (mode !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(600); }
await page.locator('.story-block-sidebar-tab[data-tab-id="ext:rpg-battle"]').click(); await page.waitForTimeout(800);
console.log('create:', JSON.stringify(await page.evaluate(() => ({ name: document.querySelector('.rpg-battle-name-input')?.value ?? null, hint: document.querySelector('.rpg-battle-name-hint')?.textContent ?? null }))));
console.log('errors:', errors.join('\n') || 'none');
await browser.close();
