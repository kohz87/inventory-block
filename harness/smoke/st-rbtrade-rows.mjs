import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/trade-rows`;
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Adventurer Guild Post')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nGranary Cellar Rat Tail | 5 | material · AGI, poison\nBrood-Mother Skull | 1 | uncommon material · MDEF\nMinor Healing Draught | 4 | heal 20 · Weak restorative fluid (heals minor wounds)');
const inv = () => ev(() => { const c = SillyTavern.getContext(); return (c.chat.at(-1).mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]; });
const pick = t => t.split('\n').filter(l => /Coin|Rat Tail|Skull|Draught|Rope|Whetstone/.test(l)).join(' / ');
const trade = async () => { await h.tab('ext:rpg-party'); await page.waitForTimeout(600); await ev(() => document.querySelectorAll('.rpg-battle-page')[1]?.click()); await page.waitForTimeout(800); };
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(base, 'I go to the guild post.');
await page.waitForTimeout(2500);
await trade();
console.log('before:', pick(await inv()));
const rows = () => ev(() => [...document.querySelectorAll('.rpg-trade-sell-list .rpg-trade-item.is-row')].map(li => `${li.querySelector('.rpg-trade-item-name').textContent} | ${li.querySelector('.rpg-trade-note')?.textContent ?? ''} | ${li.querySelector('.rpg-trade-count')?.textContent ?? '-'} | ${li.querySelector('.rpg-trade-sell').textContent} [${li.querySelector('.rpg-trade-sell').getAttribute('aria-label')}] h=${Math.round(li.getBoundingClientRect().height)}`).join('\n  '));
console.log('sell rows:\n  ' + await rows());
// Two more rat tails, then sell 3.
for (let i = 0; i < 2; i++) { await ev(() => document.querySelector('.rpg-trade-sell-list .rpg-trade-more').click()); await page.waitForTimeout(250); }
console.log('row after +2:', (await rows()).split('\n')[0]);
await ev(() => document.querySelector('.rpg-trade-sell-list .rpg-trade-sell').click());
await page.waitForTimeout(1500);
console.log('after sale:', pick(await inv()));
// Buy the first thing on the shelf.
await trade();
console.log('buy rows:', await ev(() => [...document.querySelectorAll('.rpg-trade-buy-list .rpg-trade-item.is-row')].slice(0, 3).map(li => `${li.querySelector('.rpg-trade-item-name').textContent} ${li.querySelector('.rpg-trade-buy').textContent}`).join(' / ')));
await ev(() => document.querySelector('.rpg-trade-buy-list .rpg-trade-buy:not([disabled])').click());
await page.waitForTimeout(1500);
console.log('after buy:', pick(await inv()));
await trade();
console.log('told:', await ev(() => [...document.querySelectorAll('.rpg-trade-told li')].map(li => li.textContent).join(' | ')));
console.log('undo buttons:', await ev(() => document.querySelectorAll('.rpg-trade-undo').length));
await page.screenshot({ path: `${OUT}/trade-desktop-told.png` });
// Undo the sale: the tails come back, the purchase stays.
await ev(() => document.querySelectorAll('.rpg-trade-undo')[0].click());
await page.waitForTimeout(1500);
console.log('after undo of the sale:', pick(await inv()));
await trade();
console.log('told now:', await ev(() => [...document.querySelectorAll('.rpg-trade-told li')].map(li => li.textContent).join(' | ')));
await ev(() => { const el = document.querySelector('.rpg-trade-sell-list'); el?.scrollIntoView({ block: 'start' }); });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/trade-desktop.png` });
console.log('wide on desktop?', await ev(() => document.querySelector('.rpg-trade-tab').className));
for (const [name, w, hgt] of [['tablet', 820, 1180], ['tablet-landscape', 1180, 820], ['mobile', 390, 844]]) {
  await page.setViewportSize({ width: w, height: hgt });
  await page.waitForTimeout(800);
  await h.dock().catch(() => {});
  await trade();
  await ev(() => { const el = document.querySelector('.rpg-trade-sell-list'); el?.scrollIntoView({ block: 'start' }); });
  await page.waitForTimeout(500);
  console.log(name, 'tab classes:', await ev(() => document.querySelector('.rpg-trade-tab')?.className), 'pane w:', await ev(() => Math.round(document.querySelector('.rpg-trade-tab')?.getBoundingClientRect().width ?? 0)));
  await page.screenshot({ path: `${OUT}/trade-${name}.png` });
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
