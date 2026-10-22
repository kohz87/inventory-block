import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const ws = (time, loc) => `<World_State>\n**📅 Time:** ${time} | **🌤 Loc:** ${loc} | **🌡 Wx:** Rain\n---\n**🧍 Ren:**\n* *Outfit:* Drake armor\n</World_State>`;
const env = body => `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n${body}\n</Blocks>\n-->`;
const pack = JSON.parse(fs.readFileSync('/home/user/story_director/tests/fixtures/world-pack.json', 'utf8'));
delete pack.calendar; pack.edges.find(e => e.b === "Hollin's Reach").bearing = 'E/W';   // a model's slip
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('dialog', d => d.dismiss());
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
console.log('version', await page.evaluate(() => window.StoryDirector?.version ?? document.querySelector('#story_director_settings')?.textContent.match(/v\d+\.\d+\.\d+/)?.[0]));
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
// Import through the settings panel's paste box.
await page.evaluate(text => {
  const sd = SillyTavern.getContext().extensionSettings.storyDirector;
  sd.map = { north: 'up', east: 'right', kmPerUnit: 10, roadFactor: 1.25 };
  const box = document.querySelector('#story_director_pack_paste textarea, textarea.story-director-pack-paste');
  box.value = text;
  document.querySelector('.story-director-pack-import')?.click();
}, JSON.stringify(pack));
await page.waitForTimeout(1500);
console.log('import message:', await page.evaluate(() => document.querySelector('.story-director-pack-message')?.textContent));
await page.evaluate(async list => {
  const ctx = SillyTavern.getContext();
  for (const block of ctx.extensionSettings.storyBlock.blocks) block.enabled = ['world-state'].includes(block.id);
  ctx.chat.splice(1);
  for (const body of list) {
    ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'We travel on.' });
    ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'The road goes on.' + body, swipes: null });
  }
  await ctx.saveChat(); await ctx.reloadCurrentChat();
}, [ws('CY 611, Haywane 10, 06:00 am', 'Bluewatch Village | Square | [64.4, 110.0]'), ws('CY 611, Haywane 15, 06:00 pm', 'Auvoth | Terrace | [59.0, 110.0]'), ws('CY 611, Haywane 18, 06:00 pm', "Hollins Reach | Branch office | [70.0, 104.0]")].map(env));
await page.waitForTimeout(2000);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(500);
await page.click('.story-director-fold.is-places > summary'); await page.waitForTimeout(400);
const info = await page.evaluate(() => { const f = document.querySelector('.is-places'); return { hint: f.querySelector('.is-disagree')?.textContent, text: f.querySelector('.story-director-records')?.innerText.replace(/\s+/g, ' ') }; });
console.log('places', JSON.stringify(info, null, 1));
await page.evaluate(() => document.querySelector('.is-places')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sd-pack-wins.png` });
console.log('route:', await page.evaluate(async () => (await SillyTavern.getContext().executeSlashCommandsWithOptions?.("/route Bluewatch Village to Hollin's Reach"))?.pipe));
await page.evaluate(() => { const sd = SillyTavern.getContext().extensionSettings.storyDirector; delete sd.worldPack; SillyTavern.getContext().saveSettingsDebounced(); });
await browser.close();
