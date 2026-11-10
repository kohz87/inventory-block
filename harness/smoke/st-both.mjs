import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8');
const withDirector = lines => r4.replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
// Director: lock on, a warning about an untracked name.
await ev(() => { const s = SillyTavern.getContext().extensionSettings; const k = Object.keys(s).find(x => /story.?director/i.test(x)); if (k) s[k].spoilerGuard = true; });
await h.turn(withDirector('! Zeppelin Sighting — a shape in the clouds'), 'Listen.');
await page.waitForTimeout(2000);
await h.tab('ext:story-director'); await page.waitForTimeout(700);
console.log('director:', await ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return { locked: Boolean(p?.querySelector('.story-director-lock')), counts: p?.querySelector('.story-director-lock-counts')?.textContent, warning: p?.innerText.match(/Zeppelin Sighting[^\n]*/)?.[0] ?? 'none' }; }));
// RPG Battle: After a fight fold, code-only next moves.
await ev(() => { const s = SillyTavern.getContext().extensionSettings.rpgBattle; s.nextMovesModel = 'code'; });
console.log('fold:', await ev(() => document.querySelector('.story-suite-fold[data-fold="after"]')?.innerText.replace(/\n+/g, ' | ').slice(0, 200)));
await h.turn(r4.replace(/<Director>[\s\S]*?<\/Director>/, '<Encounter>\n1 Granary Rat (weak)\n</Encounter>'), 'I swat the rat.');
await page.waitForTimeout(2000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(500);
await h.click('Fight'); await page.waitForTimeout(500); await h.click('^Start'); await page.waitForTimeout(2000); await h.click('^Auto'); await page.waitForTimeout(2500);
console.log('next moves:', await ev(() => [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none')?.innerText.match(/WHAT NEXT\?[\s\S]{0,200}/i)?.[0]?.replace(/\n/g, ' | ') ?? 'none'));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
