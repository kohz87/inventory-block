import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.env.ST_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StoryBlock?.apiVersion === 2 && StoryBlock.sdk.modules().length >= 4, null, { timeout: 90000 });
await page.waitForTimeout(2000);
console.log(await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
  await new Promise(r => setTimeout(r, 2000));
  const out = {};
  try { const h = StoryBlock.sdk.dialog.open('rpg-battle/create', { draft: {} }); out.handle = !!h; } catch (e) { out.err = e.message; }
  out.dialog = document.querySelector('.ss-dialog')?.innerText?.slice(0, 300);
  return JSON.stringify(out);
}));
await page.screenshot({ path: '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/uiux/v2/combined-wizard-direct.png' });
await browser.close();
