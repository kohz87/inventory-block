import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(4000);
console.log('version:', await page.evaluate(() => window.StorySuite?.providers().find(p => p.id === 'rpg-battle')?.version));
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForTimeout(3000);
const before = await page.evaluate(() => window.StoryBlock.getBlock('Inventory')?.text);
await page.evaluate(async () => {
  const ctx = SillyTavern.getContext(); const sb = window.StoryBlock;
  const inv = ['[Equipment > Weapons]', 'Iron Longsword | 1 | equipped · uncommon · ATK +6, DEX -1', '[Equipment > Armour]', 'Studded Jerkin | 1 | equipped · common · DEF +4', 'Iron Helm | 1 | equipped', 'Travel Boots | 1 | equipped · uncommon',
    '[Equipment > Accessories]', 'Ring of Giants | 1 | equipped · common · STR +20', 'Silver Ring | 1 | equipped', 'Owl Charm | 1 | equipped · rare', '[Consumables]', 'Healing Draught | 2 | heal 30'].join('\n');
  await sb.setBlockText(ctx.chat.length - 1, 'Inventory', inv); sb.refresh();
});
await page.waitForTimeout(1000);
await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(600);
await page.locator('.story-block-sidebar-tab[data-tab-id="ext:rpg-battle"]').click(); await page.waitForTimeout(800);
const gear = () => page.evaluate(() => ({
  counted: [...document.querySelectorAll('.rpg-battle-gear')].map(li => li.textContent.replace(/\s+/g, ' ').trim()),
  unused: document.querySelector('.rpg-battle-gear-unused')?.textContent ?? null,
}));
console.log('gear:', JSON.stringify(await gear(), null, 1));
await page.locator('.rpg-battle-section.is-gear').screenshot({ path: `${S}/shots/gear.png` }).catch(e => console.log('shot', e.message));
// Settings: 3 accessories
await page.evaluate(() => { const n = document.querySelector('#rpg_battle_gear_accessories'); n.value = '3'; n.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(800);
window: await page.evaluate(() => window.StoryBlock.refresh());
await page.waitForTimeout(800);
console.log('after accessories=3:', JSON.stringify(await gear(), null, 1));
await page.evaluate(() => { const n = document.querySelector('#rpg_battle_gear_accessories'); n.value = '2'; n.dispatchEvent(new Event('change', { bubbles: true })); });
await page.evaluate(async (text) => { const ctx = SillyTavern.getContext(); await window.StoryBlock.setBlockText(ctx.chat.length - 1, 'Inventory', text ?? ''); }, before);
await page.waitForTimeout(1500);
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
