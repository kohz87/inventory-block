import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const out = process.argv[2];
const ws = (outfit, mood, loc) => `<World_State>\n**📅 Time:** CY 611, Haywane 12, 05:15 pm | **🌤 Loc:** Auvoth | ${loc} | **🌡 Wx:** Heavy timber smoke, freezing gale, 1°C, dusk gathering\n\n---\n\n**🧍 Ren:**\n* *Outfit:* ${outfit}\n* *Position:* By the cistern grate, kneeling\n* *Visible Condition:* Soot-streaked, shivering\n\n---\n\n**👥 NPCs Present:**\n**Corvin — imperial engineer:**\n* *Outfit:* Oilcloth greatcoat, brass goggles\n* *Position:* At the terrace rail\n* *Mood:* ${mood}\n* *Agenda:* Get the sappers into the basin\n* *Secret:* He flooded the lower sumps himself\n\n---\n**🔥 Unresolved Threads:**\n* Who opened the sump gates?\n**🎯 Arc Phase:** Escalation\n**🎬 Scene Phase:** Building\n</World_State>`;
const env = body => `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n${body}\n</Blocks>\n-->`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
for (const [size, width, height] of [['phone', 390, 844], ['tablet', 800, 1280]]) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 60000 });
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
  await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
  await page.evaluate(async ({ a, b }) => {
    const ctx = SillyTavern.getContext();
    for (const block of ctx.extensionSettings.storyBlock.blocks) block.enabled = ['inventory', 'world-state', 'choices', 'dice-everyone'].includes(block.id);
    ctx.chat.splice(1);
    const g = ctx.chat[0];
    g.mes = g.mes.replace(/\n<!-- STORY_BLOCKS_V1[\s\S]*$/, '') + a;
    if (Array.isArray(g.swipes)) g.swipes[g.swipe_id ?? 0] = g.mes;
    ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'I check the grate.' });
    ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'The water rose another inch.' + b, swipes: null });
    await ctx.saveChat(); await ctx.reloadCurrentChat();
  }, { a: env(ws('Dripping reinforced drake armor, charred left gauntlet, eye band, pine-tar cloak', 'Calm, calculating', 'Seventh Seal Terrace')), b: env(ws('Soaked reinforced drake armor, charred left gauntlet, eye band, pine-tar cloak', 'Impatient', 'Seventh Seal Terrace · Leased Mansion Courtyard')) });
  await page.waitForTimeout(2000);
  const mode = await page.evaluate(() => document.querySelector('#story_block_sidebar')?.dataset.mode);
  await page.locator('#story_block_handle').click();
  await page.waitForTimeout(500);
  await page.locator('button.story-block-sidebar-tab[data-tab-id="block:world-state"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/v051-${size}.png` });
  await page.locator('.story-block-changes-summary').first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/v051-${size}-open.png` });
  console.log(size, mode, await page.evaluate(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.querySelector('.story-block-sidebar-tab-short')?.textContent)));
  await page.close();
}
await browser.close();
