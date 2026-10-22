import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/rb-fix2`;
const h = await open({ width: 1180, height: 900 });
const { page, ev } = h;
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
const inventory = `<Inventory>
Coin Pouch | 1 | 4 Silver, 4 Copper
[Equipment > Weapons]
Short Sword | 1 | Equipped · Common · ATK +4 · Notched near the guard
[Equipment > Armour]
Leather Jerkin | 1 | Equipped · Common · DEF +2
[Gear]
Rope | 1 | 30 ft, hemp
Waterskin | 1 | Half full
[Money]
Silver Coins | 3
Copper | 36
[Loot]
Cellar Rat Tail | 6 | material · AGI, poison
Gnawed Bone | 3 | material · MDEF
[On Order]
Skull Charm | 1 | uncommon · MDEF +4 · accessory · on order with the bone-carver, ready Goldwane 14
</Inventory>`;
const village = r3.replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Adventurer Guild Post').replace(/<Inventory>[\s\S]*?<\/Inventory>/, inventory);
const cellar = r3.replace('Harrowford outskirts | The Old Weir', 'Granary cellar | under the mill').replace(/<Inventory>[\s\S]*?<\/Inventory>/, inventory)
  .replace('</Blocks>', '<Encounter>\n2 cellar rats, even\n</Encounter>\n</Blocks>');
const trade = async () => { await h.tab('ext:rpg-party'); await page.waitForTimeout(600); await ev(() => document.querySelectorAll('.rpg-battle-page')[1]?.click()); await page.waitForTimeout(900); };
const sidebar = () => page.locator('#story_block_sidebar');

await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock().catch(() => {});
// An old chat's "Prices here" choice, kept in the chat as 0.5.45 did.
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chatMetadata.rpgBattle = { ...(ctx.chatMetadata.rpgBattle ?? {}), tradePrices: { 'bluewatch village': 'dear' } }; await ctx.saveMetadata(); });
console.log('placePrices before reopen:', await ev(() => JSON.stringify(SillyTavern.getContext().extensionSettings.rpgBattle?.placePrices ?? null)));
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(1500);
console.log('placePrices after reopen:', await ev(() => JSON.stringify(SillyTavern.getContext().extensionSettings.rpgBattle?.placePrices)), 'chat tradePrices:', await ev(() => JSON.stringify(SillyTavern.getContext().chatMetadata.rpgBattle?.tradePrices)));
await h.dock().catch(() => {});

// 1. In a village: open, purse right, prices read-only.
await h.turn(village, 'I go to the guild post.');
await page.waitForTimeout(2500);
await trade();
console.log('VILLAGE:', (await h.pane()).slice(0, 420));
console.log('price select:', await ev(() => Boolean(document.querySelector('.rpg-trade-level'))));
await sidebar().screenshot({ path: `${OUT}/trade-village.png` });

// 2. Settings: the Trade fold with the migrated place.
await ev(() => document.querySelector('#extensions-settings-button .drawer-toggle')?.click());
await page.waitForTimeout(800);
await ev(() => {
  const root = document.querySelector('.rpg-battle-settings');
  const toggle = root?.querySelector('.inline-drawer-toggle');
  if (root && !root.querySelector('.inline-drawer-content')?.offsetParent) toggle?.click();
});
await page.waitForTimeout(600);
await ev(() => { const f = document.querySelector('.story-suite-fold[data-fold="trade"]'); if (f) f.open = true; f?.scrollIntoView({ block: 'start' }); });
await page.waitForTimeout(400);
// Add a place by hand.
await page.fill('#rpg_battle_place_name', 'Harrowford');
await page.selectOption('#rpg_battle_place_level', 'cheap');
await ev(() => document.querySelector('.rpg-battle-settings-place-add')?.click());
await page.waitForTimeout(500);
console.log('settings list:', await ev(() => document.querySelector('.story-suite-fold[data-fold="trade"]')?.innerText.replace(/\n+/g, ' | ')));
console.log('placePrices now:', await ev(() => JSON.stringify(SillyTavern.getContext().extensionSettings.rpgBattle?.placePrices)));
await page.locator('.story-suite-fold[data-fold="trade"]').screenshot({ path: `${OUT}/settings-trade.png` });
await ev(() => document.querySelector('#extensions-settings-button .drawer-toggle')?.click());
await page.waitForTimeout(600);
await trade();
console.log('VILLAGE (dear):', await ev(() => document.querySelector('.rpg-trade-place')?.textContent));

// 3. A cellar: no market, orders read-only; an encounter "2 cellar rats, even".
await h.turn(cellar, 'We go down into the cellar.');
await page.waitForTimeout(2500);
await trade();
console.log('CELLAR:', (await h.pane()).slice(0, 420));
await sidebar().screenshot({ path: `${OUT}/trade-no-market.png` });

// 4. The fight: two rats, no "Even".
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('offer pane:', (await h.pane()).slice(0, 300));
console.log('offer:', await h.click('Fight'));
await page.waitForTimeout(800);
console.log('start:', await h.click('^Start'));
await page.waitForTimeout(3000);
console.log('foes:', await ev(() => [...document.querySelectorAll('.rpg-battle-card.is-enemy')].map(c => c.querySelector('.rpg-battle-card-name, .rpg-battle-name, b')?.textContent?.trim() ?? c.innerText.split('\n')[0])));
await sidebar().screenshot({ path: `${OUT}/fight-two-rats.png` });
for (let i = 0; i < 40; i++) {
  const mode = await ev(() => document.querySelector('.rpg-battle-tab')?.dataset.mode);
  if (mode !== 'fight') break;
  await ev(() => document.querySelector('.rpg-battle-act.is-attack')?.click()); await page.waitForTimeout(150);
  await ev(() => document.querySelector('.rpg-battle-card.is-enemy.is-pickable')?.click()); await page.waitForTimeout(400);
}
await page.waitForTimeout(1500);
console.log('result:', (await h.pane()).slice(0, 600));
await sidebar().screenshot({ path: `${OUT}/fight-result.png` });
console.log('bestiary:', await ev(() => JSON.stringify((SillyTavern.getContext().chatMetadata.rpgBattle?.bestiary ?? []).map(e => e.name))));
console.log('inventory after:', await ev(() => globalThis.StoryBlock.getBlock('Inventory')?.text));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
