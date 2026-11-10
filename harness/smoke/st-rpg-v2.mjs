import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror ' + e.message));
page.on('console', m => { if (/RPG Battle\]/.test(m.text()) && !/loaded/.test(m.text())) console.log(m.type(), m.text()); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && typeof window.rpgBattleInterceptor === 'function' && window.StoryDirector?.apiVersion === 1, null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(2500);
const ws = t => `<World_State>\n**📅 Time:** ${t} | **🌤 Loc:** Weir road | **🌡 Wx:** Rain\n---\n**🧍 Ren:**\n* *Outfit:* Armour\n</World_State>`;
// Hurt Ren, then two replies 7 hours apart; the second reply is "received".
const out = await page.evaluate(async ({ a, b }) => {
  const ctx = SillyTavern.getContext();
  ctx.extensionSettings.storyDirector.calendar = { preset: 'custom', era: 'CY', daysPerMonth: 30, months: ['Dawnwane','Rainmoot','Greengale','Highsun','Goldwane','Haywane','Emberwane','Nightfall','Frostfall','Deepwinter','Icewane','Yearsend'].map(name => ({ name, days: 30 })) };
  const sb = window.StoryBlock;
  const last = ctx.chat.length - 1;
  const sheet = sb.getBlock('Character').text.replace(/HP: \d+\/(\d+)/, (m, max) => `HP: 20/${max}`);
  await sb.setBlockText(last, 'Character', sheet);
  const mes0 = ctx.chat[last].mes;
  ctx.chat[last].mes = mes0.replace('<Blocks>', '<Blocks>\n' + a);
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'We make camp and sleep.' });
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'Dawn comes grey.\n<!-- STORY_BLOCKS_V1\n<Blocks>\n' + b + '\n</Blocks>\n-->', swipes: null });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
  return { times: [window.StoryDirector.timeAt(last), window.StoryDirector.timeAt(ctx.chat.length - 1)].map(t => window.StoryDirector.formatTime(t)) };
}, { a: ws('CY 611, Haywane 12, 09:00 pm'), b: ws('CY 611, Haywane 13, 05:00 am') });
console.log('times', JSON.stringify(out));
await page.waitForTimeout(1500);
console.log('hp before reply event:', await page.evaluate(() => window.StoryBlock.getBlock('Character').text.split('\n')[2]));
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.eventSource.emit(ctx.eventTypes?.MESSAGE_RECEIVED ?? ctx.event_types.MESSAGE_RECEIVED, ctx.chat.length - 1); });
await page.waitForTimeout(2000);
console.log('hp after reply event:', await page.evaluate(() => window.StoryBlock.getBlock('Character').text.split('\n')[2]));
await page.locator('#story_block_handle').click(); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:rpg-battle"]')?.click()); await page.waitForTimeout(500);
console.log('recovered note:', await page.evaluate(() => document.querySelector('.rpg-battle-recovered')?.textContent));
await page.screenshot({ path: `${S}/shots/rpg-v2-idle.png` });
// Short rest after hurting again.
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); const sb = window.StoryBlock; await sb.setBlockText(ctx.chat.length - 1, 'Character', sb.getBlock('Character').text.replace(/HP: \d+\/(\d+)/, (m, max) => `HP: 10/${max}`)); sb.refresh(); });
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.rpg-battle-rest-short')?.click()); await page.waitForTimeout(1200);
console.log('after short rest:', await page.evaluate(() => window.StoryBlock.getBlock('Character').text.split('\n')[2]));
// Use item.
await page.evaluate(() => document.querySelector('.rpg-battle-items')?.click()); await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/shots/rpg-v2-items.png` });
await page.evaluate(() => document.querySelector('.rpg-battle-use-item .rpg-battle-use:not([disabled])')?.click()); await page.waitForTimeout(1200);
console.log('after potion:', await page.evaluate(() => window.StoryBlock.getBlock('Character').text.split('\n')[2]), '|', await page.evaluate(() => window.StoryBlock.getBlock('Inventory').text.match(/Healing Draught[^\n]*/)?.[0]));
await page.evaluate(() => document.querySelector('.rpg-battle-back')?.click()); await page.waitForTimeout(400);
// Add a companion.
await page.evaluate(() => document.querySelector('.rpg-battle-add-companion')?.click()); await page.waitForTimeout(400);
await page.fill('.rpg-battle-companion-name', 'Astra');
await page.selectOption('.rpg-battle-companion-preset', 'healer');
await page.fill('.rpg-battle-companion-gear', 'Ashwood Staff (rare) · MATK +7, INT +1');
await page.screenshot({ path: `${S}/shots/rpg-v2-companion.png` });
await page.evaluate(() => document.querySelector('.rpg-battle-companion-add')?.click()); await page.waitForTimeout(1500);
console.log('party:\n' + await page.evaluate(() => window.StoryBlock.getBlock('Party')?.text));
await page.screenshot({ path: `${S}/shots/rpg-v2-party.png` });
// A fight with Astra on auto.
await page.evaluate(() => document.querySelector('.rpg-battle-start')?.click()); await page.waitForTimeout(400);
await page.fill('.rpg-battle-enemy-name', 'Wolf');
await page.selectOption('.rpg-battle-enemy-count', '3');
await page.evaluate(() => document.querySelector('.rpg-battle-begin')?.click()); await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/shots/rpg-v2-fight.png` });
console.log('fight cards:', await page.evaluate(() => [...document.querySelectorAll('.rpg-battle-card')].map(c => c.querySelector('.rpg-battle-card-name, .rpg-battle-record-name, strong')?.textContent ?? c.textContent.slice(0, 20))));
await page.evaluate(() => document.querySelector('.rpg-battle-act.is-auto')?.click()); await page.waitForTimeout(1500);
console.log('result:', await page.evaluate(() => document.querySelector('.rpg-battle-handoff, .rpg-battle-tab pre')?.textContent));
console.log('party after:\n' + await page.evaluate(() => window.StoryBlock.getBlock('Party')?.text.split('\n').slice(0, 3).join('\n')));
await browser.close();
