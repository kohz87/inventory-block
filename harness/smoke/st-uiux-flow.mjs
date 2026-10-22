import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const M = process.env.M === '1';
const out = `${S}/uiux/ours/${M ? 'phone' : 'desk'}`; fs.mkdirSync(out, { recursive: true });
const h = await open(M ? { width: 390, height: 844, mobile: true } : { width: 1440, height: 1000 });
const { page, ev } = h;
const shot = async n => page.screenshot({ path: `${out}/${n}.png` });
await h.openNarrator('The Narrator - 2026-10-18@15h00m00s000ms');
if (!M) await h.dock?.();
await page.waitForTimeout(1200);
if (M) { await shot('m00-chat'); await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(1200); await shot('m01-sheet-open'); }
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '').replace(/<Director>[\s\S]*?<\/Director>/, '<Director>\n+ hook Lime Kiln Bats — Clear the carrion bats in the old lime kiln | giver: Elke | reward: 5 silver\n+ quest Wolf Ears — Bring the wolf ears to Kael | type: bounty | giver: Kael | reward: 4 silver | due: 1203, March 5\n</Director>');
await h.turn(r4, 'Any more work?'); await page.waitForTimeout(2500);
const tabs = await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId));
console.log('tabs after quests:', tabs.join(','));
await h.tab('ext:story-director-quests'); await ev(() => document.querySelectorAll('.story-director-fold').forEach(d => d.open = true)); await page.waitForTimeout(500); await shot('20-quests');
await h.turn(r3, 'We head to the weir.'); await page.waitForTimeout(2500);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800); await shot('21-battle-offer');
console.log('battle:', (await h.pane()).slice(0, 200));
await h.click('^Fight'); await page.waitForTimeout(2500); await shot('22-battle-plan');
await h.click('^Start'); await page.waitForTimeout(2000); await shot('23-fight');
console.log('fight:', (await h.pane()).slice(0, 200));
for (let i = 0; i < 3; i++) { if (!(await h.click('^Attack|^Auto'))) break; await page.waitForTimeout(700); }
await shot('24-fight-mid');
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(500); }
await page.waitForTimeout(1500); await shot('25-result');
console.log('result:', (await h.pane()).slice(0, 300));
await h.tab('ext:npc-state-delta-dossiers'); await shot('26-dossiers');
if (!M) {
  await ev(() => { document.querySelector('#extensionsMenuButton, #extensions-settings-button .drawer-toggle')?.click(); });
  await page.waitForTimeout(1500);
  const blocks = await ev(() => [...document.querySelectorAll('#extensions_settings .inline-drawer, #extensions_settings2 .inline-drawer')].map((d, i) => ({ i, t: d.querySelector('.inline-drawer-header')?.textContent.trim().slice(0, 40) })));
  console.log('settings drawers:', JSON.stringify(blocks));
  for (const b of blocks.filter(b => /Story|RPG|NPC|Director|Battle/i.test(b.t ?? ''))) {
    await ev(i => { const d = [...document.querySelectorAll('#extensions_settings .inline-drawer, #extensions_settings2 .inline-drawer')][i]; d.querySelector('.inline-drawer-toggle')?.click(); d.scrollIntoView(); }, b.i);
    await page.waitForTimeout(900);
    const box = await ev(i => { const d = [...document.querySelectorAll('#extensions_settings .inline-drawer, #extensions_settings2 .inline-drawer')][i]; const r = d.getBoundingClientRect(); return { x: r.x, y: Math.max(0, r.y), w: r.width, h: Math.min(r.height, 1000) }; }, b.i);
    await page.screenshot({ path: `${out}/30-settings-${b.t.replace(/[^a-z0-9]+/gi, '_').slice(0, 24)}.png`, clip: { x: box.x, y: box.y, width: Math.max(10, box.w), height: Math.max(10, Math.min(box.h, 1000 - box.y)) } }).catch(e => console.log('clip fail', e.message));
    const len = await ev(i => [...document.querySelectorAll('#extensions_settings .inline-drawer, #extensions_settings2 .inline-drawer')][i].querySelectorAll('input,select,textarea,button').length, b.i);
    console.log('settings', b.t, 'controls:', len);
    await ev(i => [...document.querySelectorAll('#extensions_settings .inline-drawer, #extensions_settings2 .inline-drawer')][i].querySelector('.inline-drawer-toggle')?.click(), b.i);
  }
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
