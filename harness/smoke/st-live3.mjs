import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => Boolean(window.SillyTavern?.getContext), null, { timeout: 60000 });
await page.waitForTimeout(2500);
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 30000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  for (const b of ctx.extensionSettings.storyBlock.blocks) if (['inner-chatter', 'dice-everyone'].includes(b.id)) b.enabled = true;
  const m = ctx.chat[0];
  m.mes = m.mes.replace(/\n<!-- STORY_BLOCKS_V1[\s\S]*$/, '') + '\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<Dice_All rolls="12, 20, 4">\n🎲 You try to sit up — d20+1 vs 12 → 12+1 = 13 · success\n</Dice_All>\n<Dice_All>\n🎲 Seraphina senses the beasts — d20+2 vs 15 → 20+2 = 22 · critical success\n</Dice_All>\n<NPC_Inner_Chatter>\nSeraphina: They are still out there, circling the glade. I will not let them near this one again.\n</NPC_Inner_Chatter>\n<Inventory>\nCoin Pouch | 1 | 85 Gold\n</Inventory>\n</Blocks>\n-->';
  if (Array.isArray(m.swipes)) m.swipes[m.swipe_id ?? 0] = m.mes;
  await ctx.saveChat(); await ctx.reloadCurrentChat();
});
await page.waitForTimeout(2000);
for (const id of ['block:dice-everyone', 'block:inner-chatter']) {
  await page.locator('button.story-block-sidebar-tab[data-tab-id="' + id + '"]').click().catch(e => errors.push(String(e)));
  await page.waitForTimeout(500);
  await page.screenshot({ path: out + '/live-' + id.split(':')[1] + '.png', clip: { x: 1060, y: 0, width: 380, height: 700 } });
}
console.log(await page.evaluate(() => ({ tabs: [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId), diceCards: document.querySelectorAll('.story-block-dice-card, .story-block-dice .story-block-dice-roll').length })), errors.join(' | '));
await browser.close();
