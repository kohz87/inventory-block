// Data-module smoke: import the factions example pack through the UI, enable it for a new chat in Setup → Data modules,
// play the doc's three reputation lines, then delete the last reply and reload. Prints the module view after each step.
import { createRequire } from 'node:module';
import { connect, openChat, makeCharacter } from './create.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright');
const PACK = process.argv[2] ?? '/home/user/st-smoke/data/default-user/extensions/Story_block/examples/packs/ersveil-factions/pack.json';
const MODULE = 'pack.ersveil-factions/reputation';
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
const out = { steps: [] };
const view = () => page.evaluate(m => { try { return StoryBlock.sdk.query('dataModules.view', { module: m }); } catch (e) { return 'err ' + e.message; } }, MODULE);
const clickText = async (text, exact = true) => { const b = page.getByText(text, { exact }); for (let n = 0; n < await b.count(); n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); await page.waitForTimeout(1500); return true; } return false; };
const clickButton = async name => { const b = page.getByRole('button', { name }); for (let n = 0; n < await b.count(); n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); await page.waitForTimeout(1500); return true; } return false; };
await page.goto('http://127.0.0.1:8150/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 });
await page.waitForTimeout(5000);
await connect(page); await openChat(page);
await page.evaluate(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/newchat')); await page.waitForTimeout(4000);
out.created = await makeCharacter(page, line => out.steps.push(`create: ${line}`.slice(0, 120))); await page.waitForTimeout(3000);
out.steps.push(['open settings', await clickText('Suite'), await clickText(/Tabs\s*&(amp;)?\s*Packs/, false)]);
await page.locator('input.ss-packs-file').first().setInputFiles(PACK); await page.waitForTimeout(3000);
out.import = await page.evaluate(() => document.querySelector('.ss-packs-message')?.textContent ?? null);
// The Data modules card refreshes when the settings are opened again (logged as a follow-up).
await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
out.steps.push(['reopen', await clickText('Suite'), await clickText(/Tabs\s*&(amp;)?\s*Packs/, false)]);
await page.locator('.ss-dm-card').scrollIntoViewIfNeeded().catch(() => {});
out.steps.push(['enable', await clickButton(/Enable for this chat/), await clickButton(/^\s*Enable\s*$/)]);
await page.screenshot({ path: '/home/user/st-smoke/dm-setup.png' });
out.afterPin = await view();
await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
async function send(text) {
    const before = await page.evaluate(() => document.querySelectorAll('#chat .mes').length);
    await page.fill('#send_textarea', text); await page.press('#send_textarea', 'Enter');
    await page.waitForFunction(n => document.querySelectorAll('#chat .mes').length >= n + 2, before, { timeout: 90000 }).catch(() => out.steps.push(`timeout ${text}`));
    await page.waitForTimeout(3000);
}
for (const t of ["I repair the Guild's weir.", 'I bring back the register.', "I break the Watch's seal."]) { await send(t); out.steps.push([t, await view()]); }
await page.evaluate(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/del 2')); await page.waitForTimeout(4000);
out.afterDeleteLast = await view();
const chat = await page.evaluate(() => SillyTavern.getContext().chatId);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 }); await page.waitForTimeout(6000);
await page.evaluate(async name => { const ctx = SillyTavern.getContext(); await ctx.executeSlashCommandsWithOptions?.('/go Ersveil'); if (ctx.chatId !== name) await ctx.openCharacterChat?.(name); }, chat); await page.waitForTimeout(5000);
out.afterReload = await view();
out.pageErrors = errors;
console.log(JSON.stringify(out, null, 1).slice(0, 6000));
await browser.close();
