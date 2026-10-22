import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const ws = `<World_State>\n**📅 Time:** CY 611, Haywane 12, 05:35 pm | **🌤 Loc:** Auvoth | Guild Hall | **🌡 Wx:** Rain\n---\n**🧍 Ren:**\n* *Outfit:* Drake armor\n</World_State>`;
const dir = `<Director>
+ quest Bounty on Kettle Jack — giver: Warden Hale | goal: bring him in alive | reward: 40 crowns | due: Haywane 30 | step: asking at the docks
+ agenda Senior Listener Geva — now: Bailiff Court | then: files the warrant | on: Haywane 13
+ bounty Wolf pelts — giver: Tanner Oswin | reward: 2 silver each | goal: wolf pelts, no limit
+ quest The Drowned Crown — type: main | goal: find the crown before the Council vote | due: Haywane 14
+ quest Rat cellar — goal: clear the cellar
- Rat cellar — cleared, paid 5 copper
</Director>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.evaluate(async b => {
  const ctx = SillyTavern.getContext();
  for (const block of ctx.extensionSettings.storyBlock.blocks) block.enabled = ['world-state'].includes(block.id);
  ctx.chat.splice(1);
  ctx.chat.push({ name: 'User', is_user: true, is_system: false, send_date: Date.now(), mes: 'I take the bounty.' });
  ctx.chat.push({ name: 'Seraphina', is_user: false, is_system: false, send_date: Date.now(), mes: 'Hale stamps the writ.' + b, swipes: null });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
}, `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n${ws}\n${dir}\n</Blocks>\n-->`);
await page.waitForTimeout(2000);
await page.locator('#story_block_handle').click(); await page.waitForTimeout(500);
console.log('tabs:', await page.evaluate(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId + ':' + (t.querySelector('.story-block-sidebar-tab-badge, [class*=badge]')?.textContent ?? ''))));
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director-quests"]')?.click()); await page.waitForTimeout(500);
console.log('quests tab:', await page.evaluate(() => document.querySelector('.story-director-quests')?.innerText.replace(/\s+/g, ' ')));
await page.screenshot({ path: `${S}/shots/sd-quests-tab.png` });
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(500);
console.log('locked:', await page.evaluate(() => { const t = document.querySelector('.story-director-tab'); return { quests: t.querySelector('.is-quest')?.innerText.replace(/\s+/g, ' '), geva: /Geva/.test(t.textContent) }; }));
await page.screenshot({ path: `${S}/shots/sd-quests-locked.png` });
console.log('note:\n' + await page.evaluate(async () => { const ctx = SillyTavern.getContext(); ctx.chat.push({ name: 'User', is_user: true, is_system: false, mes: 'I head to the docks.', send_date: Date.now(), extra: {} }); await window.storyDirectorInterceptor(ctx.chat, 8000, () => {}, 'normal'); ctx.chat.pop(); return ctx.extensionPrompts?.story_director?.value.split('\n').slice(0, 6).join('\n'); }));
await browser.close();
