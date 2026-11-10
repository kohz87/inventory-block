import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const ws = (time, loc) => `<World_State>\n**📅 Time:** ${time} | **🌤 Loc:** ${loc} | **🌡 Wx:** Rain\n---\n**🧍 Ren:**\n* *Outfit:* Drake armor\n</World_State>`;
const env = body => `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n${body}\n</Blocks>\n-->`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
const replies = [
  ws('CY 611, Haywane 10, 06:00 am', 'Shorn | North Gate | [50.0, 95.0]'),
  ws('CY 611, Haywane 11, 06:00 pm', 'Varnhold Watch | Barracks | [52.5, 98.0]'),
  ws('CY 611, Haywane 12, 05:35 pm', 'Auvoth | Seventh Seal Terrace | [59.0, 110.0]'),
  ws('CY 611, Haywane 12, 08:00 pm', 'Auvoth | Leased Mansion Courtyard | [59.0, 110.0]'),
];
await page.evaluate(async list => {
  const ctx = SillyTavern.getContext();
  for (const block of ctx.extensionSettings.storyBlock.blocks) block.enabled = ['world-state'].includes(block.id);
  const sd = ctx.extensionSettings.storyDirector;
  delete sd.worldPack;
  sd.map = { north: 'down', east: 'right', kmPerUnit: 10, roadFactor: 1.25 };
  sd.calendar = { preset: 'custom', era: 'CY', daysPerMonth: 30, months: ['Dawnwane','Rainmoot','Greengale','Highsun','Goldwane','Haywane','Emberwane','Nightfall','Frostfall','Deepwinter','Icewane','Yearsend'].map(name => ({ name, days: 30 })) };
  ctx.chat.splice(1);
  for (const body of list) {
    ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'We travel on.' });
    ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'The road goes on.' + body, swipes: null });
  }
  await ctx.saveChat(); await ctx.reloadCurrentChat();
}, replies.map(env));
await page.waitForTimeout(2000);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(500);
await page.click('.story-director-fold.is-places > summary'); await page.waitForTimeout(400);
const info = await page.evaluate(() => { const f = document.querySelector('.is-places'); return { count: f.querySelector('.story-director-count')?.textContent, text: f.querySelector('.story-director-records')?.innerText.replace(/\s+/g, ' '), svg: Boolean(f.querySelector('svg.story-director-map')) }; });
console.log('places', JSON.stringify(info, null, 1));
await page.evaluate(() => document.querySelector('.is-places')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sd-places.png` });
const route = await page.evaluate(async () => {
  const r = await SillyTavern.getContext().executeSlashCommandsWithOptions?.('/route Shorn to Auvoth');
  return r?.pipe;
});
console.log('route:', route);
console.log('note place header:', await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await window.storyDirectorInterceptor(ctx.chat, 8000, () => {}, 'normal'); return ctx.extensionPrompts?.story_director?.value.split('\n')[0]; }));
await browser.close();
