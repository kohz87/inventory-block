import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const ws = (time, loc) => `<World_State>\n**📅 Time:** ${time} | **🌤 Loc:** ${loc} | **🌡 Wx:** Clear\n---\n**🧍 Ren:**\n* *Outfit:* Jacket\n</World_State>`;
const env = body => `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n${body}\n</Blocks>\n-->`;
const pack = {
  source: 'Harbor City', era: 'modern', scale_km_per_unit: 1,
  places: { 'Elm Street': { x: 0, y: 0 }, Downtown: { x: 10, y: 5 }, 'Harbor Airport': { x: 30, y: 0 }, 'North City': { x: 30, y: 900 }, Lakeside: { x: -8, y: -6 } },
  edges: [
    { a: 'Elm Street', b: 'Downtown', km: 14, code: 'ST', bearing: 'NE/SW' },
    { a: 'Downtown', b: 'Harbor Airport', km: 25, code: 'MW' },
    { a: 'Downtown', b: 'Harbor Airport', km: 24, code: 'RL' },
    { a: 'Harbor Airport', b: 'North City', km: 920, code: 'AR' },
    { a: 'Downtown', b: 'North City', km: 1100, code: 'MW' },
    { a: 'Elm Street', b: 'Lakeside', km: 12, code: 'TR' },
  ],
};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.log('pageerror', e.message));
page.on('dialog', d => d.dismiss());
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
console.log('travel select:', await page.evaluate(() => [...document.querySelectorAll('#story_director_map_era option')].map(o => o.textContent).join(' | ')));
await page.evaluate(text => {
  const box = document.querySelector('textarea.story-director-pack-paste');
  box.value = text;
  document.querySelector('.story-director-pack-import')?.click();
}, JSON.stringify(pack));
await page.waitForTimeout(1500);
console.log('import:', await page.evaluate(() => document.querySelector('.story-director-pack-message')?.textContent));
await page.evaluate(async list => {
  const ctx = SillyTavern.getContext();
  for (const block of ctx.extensionSettings.storyBlock.blocks) block.enabled = ['world-state'].includes(block.id);
  ctx.chat.splice(1);
  for (const body of list) {
    ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'I head out.' });
    ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'The city hums.' + body, swipes: null });
  }
  await ctx.saveChat(); await ctx.reloadCurrentChat();
}, [ws('June 3, 2031, 08:00 am', 'Elm Street | Apartment 4B'), ws('June 3, 2031, 09:00 am', 'Downtown | Cafe')].map(env));
await page.waitForTimeout(2000);
const route = async cmd => page.evaluate(async c => (await SillyTavern.getContext().executeSlashCommandsWithOptions?.(c))?.pipe, cmd);
console.log('plane:', await route('/route Downtown to North City plane'));
console.log('drive:', await route('/route Elm Street to North City drive'));
console.log('train:', await route('/route mode=train Downtown to Harbor Airport'));
console.log('usage:', await route('/route'));
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(600);
console.log('tab modes:', await page.evaluate(() => [...document.querySelectorAll('.story-director-route-mode option')].map(o => o.value).join(',')));
await page.evaluate(() => { document.querySelector('.story-director-fold.is-route')?.setAttribute('open', ''); const [f, t] = document.querySelectorAll('.story-director-route-input'); f.value = 'Elm Street'; t.value = 'North City'; const m = document.querySelector('.story-director-route-mode'); m.value = 'plane'; document.querySelector('.story-director-route-go')?.click(); });
await page.waitForTimeout(500);
console.log('tab result:', await page.evaluate(() => document.querySelector('.story-director-route-result')?.textContent));
await page.evaluate(() => document.querySelector('.is-route')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sd-modern-route.png` });
// No pack, Travel: Modern.
await page.evaluate(() => { const sd = SillyTavern.getContext().extensionSettings.storyDirector; delete sd.worldPack; sd.map = { ...sd.map, era: 'modern', kmPerUnit: 1 }; });
await page.evaluate(async list => {
  const ctx = SillyTavern.getContext();
  ctx.chat.splice(1);
  for (const body of list) { ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'Go.' }); ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'On.' + body, swipes: null }); }
  await ctx.saveChat(); await ctx.reloadCurrentChat();
}, [ws('June 3, 2031, 08:00 am', 'Home | Kitchen | [0, 0]'), ws('June 4, 2031, 08:00 am', 'Coast | Pier | [600, 800]')].map(env));
await page.waitForTimeout(1500);
console.log('no pack car:', await route('/route Home to Coast car'));
await page.evaluate(() => { const sd = SillyTavern.getContext().extensionSettings.storyDirector; sd.map = { ...sd.map, era: 'pre-modern' }; SillyTavern.getContext().saveSettingsDebounced(); });
await browser.close();
