import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const errors = [];
async function run(name, viewport, mobile) {
  const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', e => errors.push(name + ' pageerror ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console ' + m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite, null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
  await page.waitForTimeout(2500);
  const ev = fn => page.evaluate(fn);
  console.log(name, 'providers', JSON.stringify(await ev(() => window.StorySuite.providers().map(p => `${p.id}@${p.version} settings=${p.settings} manage=${Boolean(p.api?.manage)}`))));
  console.log(name, 'entries', JSON.stringify(await ev(() => ({
    menu: getComputedStyle(document.querySelector('#story_suite_menu') ?? document.body).display,
    links: [...document.querySelectorAll('[data-story-suite-link]')].map(n => `${n.closest('[id$="_settings"]')?.id}:${!n.hidden && getComputedStyle(n).display !== 'none'}`),
    gear: document.querySelector('.story-block-sidebar-suite') ? getComputedStyle(document.querySelector('.story-block-sidebar-suite')).display : 'missing',
  }))));
  const homes = await ev(() => ['#story_block_settings', '#story_director_settings', '#rpg_battle_settings', '#npc_state_delta_settings'].map(sel => document.querySelector(sel)?.parentElement?.id));
  // Open via the menu item.
  await page.locator('#extensionsMenuButton').click().catch(() => {}); await page.waitForTimeout(400);
  await page.locator('#story_suite_menu').click(); await page.waitForTimeout(800);
  console.log(name, 'overlay', JSON.stringify(await ev(() => ({
    open: Boolean(document.querySelector('.story-suite-overlay')),
    tabs: [...document.querySelectorAll('.story-suite-tab')].map(t => t.textContent),
    providers: [...document.querySelectorAll('.story-suite-providers > *')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).slice(0, 6),
    areas: [...document.querySelectorAll('.story-suite-area')].map(r => `${r.dataset.area}: ${r.querySelector('select')?.selectedOptions[0]?.textContent} | ${r.querySelector('.story-suite-lead')?.textContent ?? ''}`),
  }), null, 1)));
  await page.screenshot({ path: `${S}/shots/overlay-${name}-overview.png` });
  // Pick RPG Battle for items.
  const itemsRow = page.locator('.story-suite-area[data-area="items"] select');
  if (await itemsRow.count()) {
    await itemsRow.selectOption({ label: 'RPG Battle' }); await page.waitForTimeout(500);
    console.log(name, 'after items=RPG', JSON.stringify(await ev(() => ({ rpg: window.StorySuite.providers().find(p => p.id === 'rpg-battle').api.manage.sources().items, sb: window.StorySuite.providers().find(p => p.id === 'story-block').api.manage.sources().items, row: document.querySelector('.story-suite-area[data-area="items"] select').selectedOptions[0].textContent, lead: document.querySelector('.story-suite-area[data-area="items"] .story-suite-lead')?.textContent, rpgPanelSelect: document.querySelector('#rpg_battle_truth_items')?.value, sbPanelSelect: document.querySelector('#story_block_source_items')?.value }))));
    await page.locator('.story-suite-area[data-area="items"] select').selectOption({ index: 0 }); await page.waitForTimeout(500);
    console.log(name, 'after items=auto', JSON.stringify(await ev(() => ({ rpg: window.StorySuite.providers().find(p => p.id === 'rpg-battle').api.manage.sources().items, sb: window.StorySuite.providers().find(p => p.id === 'story-block').api.manage.sources().items }))));
  }
  // Switch RPG Battle off and on from the overview.
  const sw = page.locator('.story-suite-providers [data-provider-id="rpg-battle"] .story-suite-switch input, .story-suite-providers [data-provider-id="rpg-battle"] .story-suite-switch');
  if (await sw.count()) {
    await sw.first().click(); await page.waitForTimeout(600);
    console.log(name, 'rpg off', JSON.stringify(await ev(() => ({ enabled: window.StorySuite.providers().find(p => p.id === 'rpg-battle')?.enabled, checkbox: document.querySelector('#rpg_battle_enabled')?.checked }))));
    await page.locator('.story-suite-providers [data-provider-id="rpg-battle"] .story-suite-switch input, .story-suite-providers [data-provider-id="rpg-battle"] .story-suite-switch').first().click(); await page.waitForTimeout(600);
    console.log(name, 'rpg on', JSON.stringify(await ev(() => window.StorySuite.providers().find(p => p.id === 'rpg-battle')?.enabled)));
  } else console.log(name, 'no rpg switch found');
  // Each extension tab.
  for (const id of ['story-block', 'story-director', 'npc-state-delta', 'rpg-battle']) {
    const tab = page.locator(`.story-suite-tab[data-tab-id="${id}"]`);
    if (!(await tab.count())) { console.log(name, 'no tab', id); continue; }
    await tab.click(); await page.waitForTimeout(600);
    const info = await ev(() => { const pane = document.querySelector('.story-suite-pane'); const content = pane.querySelector('.inline-drawer-content'); return { panel: pane.firstElementChild?.id, contentShown: content ? getComputedStyle(content).display !== 'none' && content.getBoundingClientRect().height > 40 : null, contentH: Math.round(content?.getBoundingClientRect().height ?? 0), linkShown: [...pane.querySelectorAll('[data-story-suite-link]')].some(n => getComputedStyle(n).display !== 'none') }; });
    console.log(name, 'tab', id, JSON.stringify(info));
    await page.screenshot({ path: `${S}/shots/overlay-${name}-${id}.png` });
  }
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  const after = await ev(() => ({ open: Boolean(document.querySelector('.story-suite-overlay')) && getComputedStyle(document.querySelector('.story-suite-overlay')).display !== 'none', placeholders: document.querySelectorAll('[data-story-suite-placeholder]').length, homes: ['#story_block_settings', '#story_director_settings', '#rpg_battle_settings', '#npc_state_delta_settings'].map(sel => document.querySelector(sel)?.parentElement?.id) }));
  console.log(name, 'after close', JSON.stringify(after), 'homes before', JSON.stringify(homes));
  // Panel still works after going back: toggle RPG terms fold.
  await page.close();
}
await run('desktop', { width: 1280, height: 900 }, false);
await run('phone', { width: 390, height: 844 }, true);
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
