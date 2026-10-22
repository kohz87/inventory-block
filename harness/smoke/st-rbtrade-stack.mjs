import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/trade-rows`;
const h = await open({ width: 1180, height: 820 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Harrowford outskirts | The Old Weir', 'Bluewatch Village | Adventurer Guild Post')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Loot]\nGranary Cellar Rat Tail | 5 | material · AGI, poison\nBrood-Mother Skull | 1 | uncommon material · MDEF\nMinor Healing Draught | 4 | heal 20 · Weak restorative fluid (heals minor wounds)');
const inv = () => ev(() => { const c = SillyTavern.getContext(); return (c.chat.at(-1).mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0]; });
const pick = t => t.split('\n').filter(l => /Coin|Rat Tail/.test(l)).join(' / ');
const trade = async () => { await h.tab('ext:rpg-party'); await page.waitForTimeout(600); await ev(() => document.querySelectorAll('.rpg-battle-page')[1]?.click()); await page.waitForTimeout(800); };
const ratRow = sel => ev(s => { const li = [...document.querySelectorAll('.rpg-trade-sell-list .rpg-trade-item.is-row')].find(n => /Rat Tail/.test(n.textContent)); const b = li?.querySelector(s); b?.click(); return li ? `${li.querySelector('.rpg-trade-count')?.textContent} · ${li.querySelector('.rpg-trade-sell').textContent} [${li.querySelector('.rpg-trade-sell').getAttribute('aria-label')}]` : 'no row'; }, sel);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock().catch(() => {});
await h.turn(base, 'I go to the guild post.');
await page.waitForTimeout(2500);
await trade();
await ratRow('.rpg-trade-more'); await page.waitForTimeout(300);
await ratRow('.rpg-trade-more'); await page.waitForTimeout(300);
console.log('rat row at 3:', await ratRow('.none'));
await ratRow('.rpg-trade-sell'); await page.waitForTimeout(1500);
console.log('after selling 3:', pick(await inv()));
// A wide pane, to show the two columns (the docked sidebar and drawers are ~400px).
await trade();
await ev(() => { for (const id of ['#story_block_sidebar', '.story-block-sidebar', '.story-block-drawer']) { const n = document.querySelector(id); if (n) { n.style.width = '640px'; n.style.maxWidth = '640px'; } } });
await page.waitForTimeout(900);
await trade();
console.log('wide classes:', await ev(() => document.querySelector('.rpg-trade-tab')?.className), 'w:', await ev(() => Math.round(document.querySelector('.rpg-trade-tab')?.getBoundingClientRect().width ?? 0)));
await ev(() => document.querySelector('.rpg-trade-sell-list')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/trade-wide-grid.png` });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
