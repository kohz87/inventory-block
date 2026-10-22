import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
const ws = `<World_State>\n**📅 Time:** CY 611, Haywane 12, 05:35 pm | **🌤 Loc:** Auvoth | Seventh Seal Terrace | **🌡 Wx:** Rain\n---\n**🧍 Ren:**\n* *Outfit:* Drake armor\n</World_State>`;
const dir = `<Director>
+ event Canal Street Granary Fires — Lower city ablaze | then: curfew declared | on: Haywane 12, 06:00 pm | place: Auvoth
+ event Armed men claiming ditch-watch authority — Armed men claiming ditch-watch authority are demanding a raised ditch tax; villagers avoid the lane | place: Auvoth | settled: yes | since: Haywane 2
+ event Auvoth gate tolls doubled — The council doubled the gate tolls | place: Auvoth | settled: yes
+ agenda Senior Listener Geva — now: Bailiff Court | then: files the warrant | on: Haywane 13 | place: Auvoth
</Director>`;
await page.evaluate(async b => {
  const ctx = SillyTavern.getContext();
  for (const block of ctx.extensionSettings.storyBlock.blocks) block.enabled = ['world-state'].includes(block.id);
  ctx.extensionSettings.storyDirector = { ...(ctx.extensionSettings.storyDirector || {}), calendar: { preset: 'custom', era: 'CY', daysPerMonth: 30, months: ['Dawnwane','Rainmoot','Greengale','Highsun','Goldwane','Haywane','Emberwane','Nightfall','Frostfall','Deepwinter','Icewane','Yearsend'].map(name => ({ name, days: 30 })) } };
  ctx.chat.splice(1);
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'I look around.' });
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'Smoke over the city.' + b, swipes: null });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
}, `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n${ws}\n${dir}\n</Blocks>\n-->`);
await page.waitForTimeout(2000);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(500);
const reveal = await page.$('.story-director-reveal'); if (reveal) { await reveal.click(); await page.waitForTimeout(500); }
const state = () => page.evaluate(() => { const w = document.querySelector('.story-director-section.is-event'); const f = w?.querySelector('details.is-settled'); return { live: [...(w?.querySelectorAll(':scope > .story-director-records .story-director-record-key') ?? [])].map(n => n.textContent), settled: f?.querySelector('summary')?.innerText.replace(/\s+/g, ' '), open: f?.open }; });
console.log('closed', JSON.stringify(await state()));
await page.evaluate(() => document.querySelector('.story-director-section.is-event')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sd-settled-closed.png` });
await page.click('.story-director-section.is-event details.is-settled > summary'); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('.story-director-section.is-event details.is-settled')?.scrollIntoView());
await page.screenshot({ path: `${S}/shots/sd-settled-open.png` });
// A redraw (pin something) keeps it open.
await page.click('.story-director-section.is-agenda .story-director-pin'); await page.waitForTimeout(700);
console.log('after redraw', JSON.stringify(await state()));
await browser.close();
