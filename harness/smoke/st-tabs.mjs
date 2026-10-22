import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const errors = [];
async function run(name, viewport, mobile) {
  const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', e => errors.push(name + ' pageerror ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console ' + m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  // Many tabs: turn on every template block for this run.
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); ctx.extensionSettings.storyBlock.__saved = JSON.stringify(ctx.extensionSettings.storyBlock.blocks); for (const b of ctx.extensionSettings.storyBlock.blocks) b.enabled = true; });
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
  await page.waitForTimeout(3000);
  const mode = await page.evaluate(() => document.querySelector('#story_block_sidebar')?.dataset.mode);
  if (mode !== 'docked') { await page.locator('#story_block_handle').click(); await page.waitForTimeout(700); }
  const info = await page.evaluate(() => { const s = document.querySelector('.story-block-sidebar-tabs'); const tabs = [...s.querySelectorAll('.story-block-sidebar-tab')]; const r = s.getBoundingClientRect();
    return { mode: document.querySelector('#story_block_sidebar').dataset.mode, tabs: tabs.length, hiddenTabs: tabs.filter(t => { const b = t.getBoundingClientRect(); return b.right > r.right + 1 || b.left < r.left - 1 || b.bottom > r.bottom + 1; }).length, overflow: s.dataset.overflow ?? null, stripH: Math.round(r.height) }; });
  console.log(name, JSON.stringify(info));
  if (info.mode === 'sheet') {
    await page.mouse.move(195, (await page.locator('.story-block-sidebar-tabs').boundingBox()).y + 15);
    await page.mouse.wheel(0, 300); await page.waitForTimeout(300);
    console.log(name, 'after wheel', JSON.stringify(await page.evaluate(() => { const s = document.querySelector('.story-block-sidebar-tabs'); return { scrollLeft: Math.round(s.scrollLeft), overflow: s.dataset.overflow ?? null }; })));
    await page.evaluate(() => { const s = document.querySelector('.story-block-sidebar-tabs'); s.scrollLeft = 0; s.dispatchEvent(new Event('scroll')); });
    await page.locator('.story-block-sidebar-tab').last().evaluate(t => t.click()); await page.waitForTimeout(300);
    console.log(name, 'after picking last', JSON.stringify(await page.evaluate(() => { const s = document.querySelector('.story-block-sidebar-tabs'); const t = [...s.querySelectorAll('.story-block-sidebar-tab')].at(-1).getBoundingClientRect(); const r = s.getBoundingClientRect(); return { lastVisible: t.right <= r.right + 1 && t.left >= r.left - 1, overflow: s.dataset.overflow ?? null }; })));
  }
  await page.locator('#story_block_sidebar').screenshot({ path: `${S}/shots/tabs-${name}.png` });
  await page.evaluate(() => { const own = SillyTavern.getContext().extensionSettings.storyBlock; own.blocks = JSON.parse(own.__saved); delete own.__saved; });
  await page.close();
}
await run('desktop', { width: 1280, height: 900 }, false);
await run('phone', { width: 390, height: 844 }, true);
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
