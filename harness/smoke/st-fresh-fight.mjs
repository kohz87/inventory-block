import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const logs = [];
page.on('console', m => { if (/RPG Battle|Uncaught|TypeError|ReferenceError/i.test(m.text())) logs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
page.on('pageerror', e => logs.push(`pageerror: ${e.message}`));
await h.openNarrator('The Narrator - fresh');
await h.dock();
await h.tab('ext:rpg-party'); await page.waitForTimeout(1000);
console.log('party pane:', (await h.pane()).slice(0, 160));
await page.fill('.rpg-battle-name-input', 'Ren');
for (const [stat, n] of [['DEX', 4], ['AGI', 3], ['STR', 2], ['VIT', 2], ['INT', 2], ['CHA', 1], ['LUK', 1]]) {
  for (let i = 0; i < n; i++) await ev(s => [...document.querySelectorAll('.rpg-battle-stepper')].find(r => r.querySelector('.rpg-battle-stat-name')?.textContent === s)?.querySelector('.is-plus')?.click(), stat);
}
await page.waitForTimeout(300);
console.log('hint:', await ev(() => document.querySelector('.rpg-battle-create-hint')?.textContent));
await ev(() => document.querySelector('.rpg-battle-create')?.click());
await page.waitForTimeout(2500);
console.log('after create:', (await h.pane()).slice(0, 400));
const buttons = () => ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).filter(Boolean).join(' | '));
console.log('buttons:', await buttons());
for (let i = 0; i < 4; i++) { const c = await h.click('^(Learn|Add|Accept|Yes)'); if (!c) break; console.log('clicked', c); await page.waitForTimeout(1500); console.log('  buttons:', await buttons()); }
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
await h.turn(r3, 'I step off the barge.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
console.log('battle pane:', (await h.pane()).slice(0, 250));
console.log('fight:', await h.click('^Fight')); await page.waitForTimeout(3000);
console.log('after fight:', (await h.pane()).slice(0, 250));
console.log('start:', await h.click('^Start')); await page.waitForTimeout(2500);
console.log('after start:', (await h.pane()).slice(0, 350));
console.log('logs:', logs.slice(0, 12).join('\n') || 'none');
await h.browser.close();
