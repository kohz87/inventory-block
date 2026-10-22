// Scenario 6: RPG Battle "Import character" with bad files, through the wizard's real file input.
import fs from 'node:fs';
import * as D from './drv.mjs';
import { setExts } from './exts.mjs';
const W = Number(process.argv[2] ?? 1440);
const FILES = '/home/user/cell/out/a3/files';
const log = s => { console.log(s); fs.appendFileSync(`${D.OUT}/run-s6-${W}.log`, s + '\n'); };
fs.writeFileSync(`${D.OUT}/run-s6-${W}.log`, '');
setExts(['Story_block', 'rpg_battle']);
const p = await D.page();
D.mark(`s6-${W}`); const e0 = D.errPos();
await D.size(p, W);
await D.load(p);
await D.openChar(p, 'The Narrator', true);
const openStart = () => p.ev(async () => { const Wt = ms => new Promise(r => setTimeout(r, ms)); if (!document.querySelector('.ss-dialog .rpg-import-file')) { if (document.querySelector('.ss-gameview')?.hidden !== false) document.querySelector('.story-suite-bar-game').click(); await Wt(800); document.querySelector('.sb-ready-go')?.click(); await Wt(1000); } return !!document.querySelector('.ss-dialog .rpg-import-file'); });
async function pick(file) {
  await openStart();
  const { root } = await p.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await p.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.ss-dialog .rpg-import-file' });
  if (!nodeId) return { error: 'no file input' };
  await p.send('DOM.setFileInputFiles', { nodeId, files: [`${FILES}/${file}`] });
  await D.sleep(2500);
  return p.ev(() => ({ note: document.querySelector('.ss-dialog .rpg-import-note')?.textContent ?? null, problem: document.querySelector('.ss-dialog .rpg-import-note')?.hasAttribute('data-problem'), dialog: !!document.querySelector('.ss-dialog'), pc: (() => { try { const pc = StoryBlock.sdk.query('party.pc'); return pc ? pc.name : null; } catch (e) { return 'ERR ' + e.message; } })(), xss: window.__xss ?? null, inputDisabled: document.querySelector('.ss-dialog .rpg-import-file')?.disabled ?? null }));
}
for (const f of ['empty.json', 'notjson.json', 'huge.json', 'wrong-schema.json', 'v-weird.json', 'array.json', 'null.json', 'nocard.png', 'marker.json']) {
  const t0 = Date.now();
  const r = await pick(f);
  log(`${f}: ${Date.now() - t0}ms ${JSON.stringify(r)}`);
  if (r.note && /<|>/.test(r.note)) log(`   note shows markup chars (as text): ${r.note.slice(0, 120)}`);
}
await p.shot(`${D.OUT}/shots/s6-after-import-${W}.jpg`, 45);
// After the marker import: where do the markers show? as text? any live <b>/<img src=x>?
const where = await p.ev(async () => {
  const Wt = ms => new Promise(r => setTimeout(r, ms));
  document.querySelector('.ss-dialog .ss-dialog-close')?.click(); await Wt(500);
  const out = { liveB: [], liveImg: 0, textHits: [] };
  const scan = tag => { for (const b of document.querySelectorAll('b')) if (/^Bold$/.test(b.textContent)) out.liveB.push(tag); out.liveImg += document.querySelectorAll('img[src="x"]').length; const m = document.body.innerText.match(/.{0,30}&lt;b&gt;|.{0,30}<b>Bold.{0,20}/g); if (m) out.textHits.push(`${tag}: ${m.slice(0, 2).join(' | ')}`); };
  for (const n of [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].map(x => x.textContent.trim())) { if (document.querySelector('.ss-gameview')?.hidden !== false) document.querySelector('.story-suite-bar-game').click(); await Wt(300); [...document.querySelectorAll('.ss-gameview-nav .ss-gameview-navitem')].find(b => b.textContent.trim() === n)?.click(); await Wt(700); scan(`game-${n}`); }
  document.querySelector('.ss-gameview-close')?.click(); await Wt(300);
  scan('chat+hud');
  out.items = StoryBlock.sdk.query('inventory.items', {}).map(i => i.name);
  out.pc = StoryBlock.sdk.query('party.pc');
  out.pc = out.pc && { name: out.pc.name, role: out.pc.role, background: out.pc.background, skills: (out.pc.skills ?? []).map(s => s.name) };
  out.xss = window.__xss ?? null;
  return out;
});
log(`markers: ${JSON.stringify(where).slice(0, 2500)}`);
const errs = D.errorsSince(e0);
log(`errors (${errs.length}):\n${errs.slice(0, 30).join('\n')}`);
p.close();
