import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = `${S}/uiux/use-now`; fs.mkdirSync(OUT, { recursive: true });
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '')
  .replace('Waterskin | 1 | Half full', 'Waterskin | 1 | Half full\n\n[Consumables]\nMinor Healing Draught | 2 | heal 20');
const inv = () => ev(() => { const c = SillyTavern.getContext(); return (c.chat.at(-1).mes.match(/<Inventory>[\s\S]*?<\/Inventory>/) ?? [''])[0].split('\n').filter(l => /Draught/.test(l)).join(' / ') || '(no draught row)'; });
const hp = () => ev(() => (document.querySelector('.story-block-pane:not([style*="none"])')?.innerText.match(/HP[^\n]{0,20}/) ?? [''])[0]);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const name = await ev(() => SillyTavern.getContext().name1);
await h.turn(base, 'I look around.');
await page.waitForTimeout(2000);
const pcName = await ev(() => { const c = SillyTavern.getContext(); const m = c.chat.map(x => x.mes).join('\n').match(/<Party>\s*\n?([^|\n]+)/); return m ? m[1].trim() : null; });
console.log('user', name, 'pc', pcName);
await h.turn(base + `\n<Wounds>\n${pcName ?? name} — grave wound: a fall into the weir\n</Wounds>`, 'I slip.');
await page.waitForTimeout(2500);
await h.tab('ext:rpg-party'); await page.waitForTimeout(800);
console.log('before:', await hp(), '|', await inv());
await h.click('^Use item'); await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/1-items.png` });
for (let i = 0; i < 3; i++) {
  const r = await ev(() => { const b = [...document.querySelectorAll('.rpg-battle-use')].find(n => n.offsetParent); if (!b) return 'no Use button'; if (b.disabled) return 'Use disabled'; b.click(); return 'clicked'; });
  await page.waitForTimeout(1200);
  console.log(`click ${i + 1}: ${r} ->`, await inv(), '| toast:', await ev(() => [...document.querySelectorAll('.toast-message')].map(n => n.textContent).at(-1) ?? ''));
}
await page.screenshot({ path: `${OUT}/2-after-uses.png` });
await h.click('^Back'); await page.waitForTimeout(800);
console.log('after:', await hp());
console.log('sent box:', await ev(() => document.getElementById('send_textarea').value || '(empty)'));
console.log('whats sent:', await ev(() => [...document.querySelectorAll('.rpg-battle-sent-text')].map(n => n.textContent).filter(t => /\[Item\]/.test(t)).join(' || ') || '(none)'));
await page.screenshot({ path: `${OUT}/3-party.png` });

await ev(async () => { const c = SillyTavern.getContext(); c.chat.push({ name: c.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: 'I catch my breath.', extra: {} }); await window.rpgBattleInterceptor(c.chat, 8000, () => {}, 'normal'); });
await page.waitForTimeout(1500);
console.log('next reply told:', await ev(() => { const c = SillyTavern.getContext(); return c.extensionPrompts?.story_suite_tail_3_rpg_battle?.value + ' @depth ' + c.extensionPrompts?.story_suite_tail_3_rpg_battle?.depth ?? '(?)'; }));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
