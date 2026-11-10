import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 200)); });
const ready = async () => { await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite, null, { timeout: 60000 }); await page.waitForTimeout(4000); };
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' }); await ready();
const before = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext(); const own = ctx.extensionSettings.storyBlock;
  const cs = own.blocks.find(b => b.template === 'character-sheet');
  const was = cs ? cs.enabled : 'missing';
  if (cs) cs.enabled = true;
  ctx.saveSettingsDebounced(); return { was, templates: own.blocks.map(b => `${b.template}:${b.enabled}`) };
});
console.log('blocks:', JSON.stringify(before));
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
const owners = () => page.evaluate(() => ({ sb: window.StorySuite.providers().find(p => p.id === 'story-block')?.owns, stats: window.StorySuite.offering('stats') }));
console.log('offers:', JSON.stringify(await owners()));
await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(800);
const tabs = await page.evaluate(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId));
console.log('tabs:', JSON.stringify(tabs));
const csTab = tabs.find(t => /character/i.test(t)); if (csTab) { await page.locator(`.story-block-sidebar-tab[data-tab-id="${csTab}"]`).click(); await page.waitForTimeout(600); }
const notices = () => page.evaluate(() => [...document.querySelectorAll('.story-block-notice.is-deferred')].map(e => e.textContent.trim()));
console.log('SB deferred notice:', JSON.stringify(await notices()));
await page.screenshot({ path: `${S}/shots/suite-cs-notice.png` });
// RPG Battle overlap notice
console.log('RPG notice text present:', await page.evaluate(() => /Character Sheet/.test(document.querySelector('#rpg_battle_settings')?.textContent ?? '')));
// Reader picks "This extension" for stats in Story Block
await page.evaluate(() => { const s = document.querySelector('#story_block_source_stats'); s.value = 'mine'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(800);
console.log('after SB stats=mine, SB notice:', JSON.stringify(await notices()));
// restore
await page.evaluate(() => { const s = document.querySelector('#story_block_source_stats'); s.value = 'auto'; s.dispatchEvent(new Event('change', { bubbles: true })); });
// SD npc=theirs check vs NSD; SD calendar=theirs moves calendar to NSD
await page.evaluate(() => { const s = document.querySelector('#story_director_source_calendar'); s.value = 'theirs'; s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(1500);
console.log('after SD calendar=theirs, owner:', await page.evaluate(() => window.StorySuite.owner('calendar')));
await page.evaluate(() => { const s = document.querySelector('#story_director_source_calendar'); s.value = 'auto'; s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); });
await page.waitForTimeout(1500);
console.log('restored calendar owner:', await page.evaluate(() => window.StorySuite.owner('calendar')));
// restore CS
await page.evaluate(() => { const ctx = SillyTavern.getContext(); const cs = ctx.extensionSettings.storyBlock.blocks.find(b => b.template === 'character-sheet'); if (cs) cs.enabled = false; ctx.saveSettingsDebounced(); });
await page.waitForTimeout(2000);
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
