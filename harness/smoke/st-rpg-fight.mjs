import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const logs = [];
page.on('pageerror', e => logs.push('pageerror ' + e.message));
page.on('console', m => { if (/RPG Battle|error/i.test(m.text()) && !/loaded/.test(m.text())) logs.push(m.type() + ': ' + m.text()); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.rpgBattleInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(2000);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:rpg-battle"]')?.click()); await page.waitForTimeout(500);
const mode = () => page.evaluate(() => document.querySelector('.rpg-battle-tab')?.dataset.mode);
console.log('mode', await mode());
await page.evaluate(() => document.querySelector('.rpg-battle-start')?.click()); await page.waitForTimeout(400);
console.log('mode', await mode());
await page.fill('.rpg-battle-enemy-name', 'Goblin');
await page.selectOption('.rpg-battle-enemy-count', '2').catch(async () => { await page.fill('.rpg-battle-enemy-count', '2'); });
await page.evaluate(() => document.querySelector('.rpg-battle-add-row')?.click()); await page.waitForTimeout(200);
await page.locator('.rpg-battle-enemy-name').nth(1).fill('Goblin Shaman');
await page.screenshot({ path: `${S}/shots/rpg-setup.png` });
await page.evaluate(() => document.querySelector('.rpg-battle-begin')?.click()); await page.waitForTimeout(800);
console.log('mode', await mode());
await page.screenshot({ path: `${S}/shots/rpg-fight.png` });
let turns = 0;
while ((await mode()) === 'fight' && turns++ < 30) {
  // Attack, then tap the first live enemy card.
  await page.evaluate(() => document.querySelector('.rpg-battle-act.is-attack')?.click()); await page.waitForTimeout(150);
  const picked = await page.evaluate(() => { const card = document.querySelector('.rpg-battle-card.is-enemy.is-pickable'); card?.click(); return Boolean(card); });
  await page.waitForTimeout(250);
  if (turns === 2) await page.screenshot({ path: `${S}/shots/rpg-fight-mid.png` });
}
console.log('turns', turns, 'mode', await mode());
await page.screenshot({ path: `${S}/shots/rpg-result.png` });
console.log('result text:', await page.evaluate(() => document.querySelector('.rpg-battle-tab')?.innerText.slice(0, 600)));
console.log('character:\n' + await page.evaluate(() => window.StoryBlock.getBlock('Character')?.text));
console.log('inventory:\n' + await page.evaluate(() => window.StoryBlock.getBlock('Inventory')?.text));
const prompt = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, mes: '*(The fight is over.)*', send_date: Date.now(), extra: {} });
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
  const first = ctx.extensionPrompts?.rpg_battle?.value;
  // A swipe of that reply sees it again; a later reply does not.
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, mes: 'The goblins lie still.', send_date: Date.now(), extra: {} });
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'swipe');
  const swipe = ctx.extensionPrompts?.rpg_battle?.value;
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, mes: 'We move on.', send_date: Date.now(), extra: {} });
  await window.rpgBattleInterceptor(ctx.chat, 8000, () => {}, 'normal');
  const later = ctx.extensionPrompts?.rpg_battle?.value;
  ctx.chat.splice(ctx.chat.length - 3, 3);
  return { first, swipeSame: swipe === first, later };
});
console.log('handoff:', JSON.stringify(prompt, null, 1));
console.log(logs.join('\n'));
await browser.close();
