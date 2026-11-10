import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8');
const mes = r4.replace(/<Director>[\s\S]*?<\/Director>/, '<Encounter>\n4 Timber Wolf (weak)\n</Encounter>');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await ev(() => { const s = SillyTavern.getContext().extensionSettings.rpg_battle ?? SillyTavern.getContext().extensionSettings.rpgBattle; return s && Object.keys(s).filter(k => /turn|speed|statCap|hit/.test(k)); }).then(v => console.log('settings keys:', v));
await h.turn(mes, 'I face the wolves.');
await page.waitForTimeout(2500);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('offer:', await h.click('Fight'));
await page.waitForTimeout(800);
console.log('start:', await h.click('^Start'));
await page.waitForTimeout(2500);
const state = () => ev(() => ({
  heading: [...document.querySelectorAll('.rpg-battle-section.is-order .rpg-battle-sub span')].map(n => n.textContent).join(' '),
  strip: [...document.querySelectorAll('.rpg-battle-order-item')].map(n => n.textContent).join(' › '),
  matchup: [...document.querySelectorAll('.rpg-battle-card.is-enemy')].slice(0, 2).map(c => c.querySelector('.rpg-battle-matchup')?.innerText.replace(/\n/g, ' · ')).join(' || '),
}));
console.log(await state());
await ev(() => document.querySelector('.rpg-battle-act.is-attack')?.click()); await page.waitForTimeout(300);
console.log('aim:', await ev(() => [...document.querySelectorAll('.rpg-battle-preview-strike')].map(n => n.innerText.replace(/\n/g, ' · ')).join(' || ')));
await page.locator('#story_block_sidebar').screenshot({ path: `${S}/shots/aim-preview.png` });
await ev(() => document.querySelector('.rpg-battle-cancel, .rpg-battle-picking button')?.click()); await page.waitForTimeout(300);
for (let i = 0; i < 3; i++) {
  await ev(() => document.querySelector('.rpg-battle-act.is-attack')?.click()); await page.waitForTimeout(200);
  await ev(() => document.querySelector('.rpg-battle-card.is-enemy.is-pickable')?.click()); await page.waitForTimeout(600);
}
console.log(await state());
console.log('log:', await ev(() => [...document.querySelectorAll('.rpg-battle-log-line')].slice(-8).map(n => n.innerText.replace(/\n/g, ' ')).join(' | ')));
// Settings panel Combat fold
console.log('combat fold:', await ev(() => document.querySelector('.story-suite-fold[data-fold="combat"]')?.innerText.replace(/\n+/g, ' | ').slice(0, 400)));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
