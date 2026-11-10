import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true });
const ready = async () => { await page.waitForFunction(() => window.StorySuite?.api('story-block')?.openSuite, null, { timeout: 60000 }); await page.waitForTimeout(4000); };
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' }); await ready();
// Make the stored list like the reader's: no Inner Chatter, nothing dismissed.
const saved = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext(); const own = ctx.extensionSettings.storyBlock;
  const backup = JSON.stringify({ blocks: own.blocks, dismissedTemplates: own.dismissedTemplates });
  own.blocks = own.blocks.filter(b => b.template !== 'inner-chatter'); own.dismissedTemplates = [];
  ctx.saveSettingsDebounced(); return backup;
});
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'domcontentloaded' }); await ready();
await page.evaluate(() => window.StorySuite.api('story-block').openSuite('story-block')); await page.waitForTimeout(800);
console.log('notice:', await page.evaluate(() => [...document.querySelectorAll('.story-suite-overlay .story-suite-notice, .story-suite-overlay [class*="new-template"], .story-suite-overlay [class*="templates-notice"]')].map(n => n.innerText.replace(/\s+/g, ' ')).join(' | ')));
await page.screenshot({ path: `${S}/shots/chatter-notice.png` });
// Add it via the notice
const added = await page.evaluate(() => { const b = [...document.querySelectorAll('.story-suite-overlay button')].find(n => /^Add$/.test(n.textContent.trim())); b?.click(); return Boolean(b); });
await page.waitForTimeout(800);
console.log('added via notice:', added, await page.evaluate(() => [...document.querySelectorAll('.story-suite-overlay .story-block-row-name')].map(n => n.textContent).join(', ')));
await page.screenshot({ path: `${S}/shots/chatter-added.png` });
await page.evaluate(b => { const ctx = SillyTavern.getContext(); Object.assign(ctx.extensionSettings.storyBlock, JSON.parse(b)); ctx.saveSettingsDebounced(); }, saved);
await page.waitForTimeout(2500);
await browser.close();
