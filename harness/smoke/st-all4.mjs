import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(4000);
const loaded = await page.evaluate(() => ({
  storyBlock: window.StoryBlock?.version,
  storyDirector: window.StoryDirector?.version,
  rpgBattle: typeof window.rpgBattleInterceptor,
  nsd: [...document.querySelectorAll('[id*="npc_state_delta"]')].length > 0,
  settingsPanels: ['story_block', 'story_director_settings', 'rpg_battle_settings', 'npc_state_delta'].map(id => [id, Boolean(document.querySelector(`[id^="${id}"]`))]),
}));
console.log('loaded:', JSON.stringify(loaded));
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(600);
console.log('tabs:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId))));
await page.screenshot({ path: `${S}/shots/all4-tabs.png` });
// Each extension's prompt contribution for a normal generation.
const prompts = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  for (const fn of [window.storyDirectorInterceptor, window.rpgBattleInterceptor]) if (typeof fn === 'function') await fn(ctx.chat, 8000, () => {}, 'normal');
  return Object.fromEntries(Object.entries(ctx.extensionPrompts ?? {}).map(([key, value]) => [key, (value?.value ?? '').length]));
});
console.log('extension prompts (chars):', JSON.stringify(prompts));
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
