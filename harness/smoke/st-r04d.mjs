import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/dossier scan failed|status of 40[04]|Bad Request/.test(m.text())) errors.push('console ' + m.text().slice(0, 240)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite, null, { timeout: 60000 });
await page.waitForTimeout(4500);
const ev = (fn, a) => page.evaluate(fn, a);
const paneText = () => ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return (p?.dataset.tabId ?? '') + ' :: ' + (p?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 900); });
const clickTab = id => ev(i => document.querySelector(`.story-block-sidebar-tab[data-tab-id="${i}"]`)?.click(), id);
const clickBtn = src => ev(s => { const r = new RegExp(s); const b = [...document.querySelectorAll('.story-block-pane button')].filter(n => n.offsetParent && !n.disabled).find(n => r.test(n.textContent.trim())); b?.click(); return b?.textContent.trim() ?? null; }, src);
// The chat from the last run is the latest one for Seraphina.
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
if (await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode) !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(500); }
console.log('tabs:', await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).join(',')));
await clickTab('ext:rpg-battle'); await page.waitForTimeout(600);
console.log('battle:', (await paneText()).slice(0, 200));
if (/Fight\?/.test(await paneText())) { console.log('fight?:', await clickBtn('^Fight')); await page.waitForTimeout(800); }
console.log('start:', await clickBtn('^(Start fight|Start)')); await page.waitForTimeout(1500);
console.log('fight:', (await paneText()).slice(0, 400));
for (let i = 0; i < 3; i++) { const a = await clickBtn('^Auto'); if (!a) break; await page.waitForTimeout(2500); }
console.log('after auto:', (await paneText()).slice(0, 900));
await page.screenshot({ path: `${S}/shots/r04-result.png` });
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
