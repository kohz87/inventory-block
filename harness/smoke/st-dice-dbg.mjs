import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StoryBlock?.apiVersion === 1 && window.StorySuite?.providers().some(p => p.id === 'rpg-battle'), null, { timeout: 60000 });
await page.waitForTimeout(3000);
await page.evaluate(async () => { window.StorySuite.providers().find(p => p.id === 'rpg-battle').api.manage.setEnabled(true); const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await window.storyBlockGenerationInterceptor(ctx.chat, 8000, () => {}, 'normal'); });
console.log(await page.evaluate(async () => {
  const m = await import('/scripts/extensions/third-party/Story_block/src/handshake.js');
  const blocks = SillyTavern.getContext().extensionSettings.storyBlock.blocks.filter(b => /dice/.test(b.id));
  const p = SillyTavern.getContext().extensionPrompts?.story_block?.value ?? '';
  const i = p.indexOf("This reply's rolls");
  return JSON.stringify({ notes: blocks.map(b => [b.id, b.kept, b.plugin, m.diceNote(b, window.StorySuite)]), around: p.slice(i - 400, i + 1600) });
}));
await browser.close();
