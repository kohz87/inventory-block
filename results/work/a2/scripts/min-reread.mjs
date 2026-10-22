// ddmin a reply text (file arg) to the smallest one whose Re-read differs from live (coin/qty/meters).
import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
import fs from 'node:fs';
console.warn = () => {}; console.error = () => {};
const key = h => { const d = h.head().domains; const q = {}; for (const s of Object.values(d.inventory.stacks)) { const n = d.inventory.defs[s.def]?.name; q[n] = (q[n] ?? 0) + s.qty; }
  return JSON.stringify({ c: Object.values(d.inventory.wallets).map(w => w.coin), q: Object.entries(q).sort(), m: d.npc?.npcs }); };
async function bad(lines) {
  const restore = seedCrypto(7);
  const h = await suiteHost();
  try { await withParty(h); await h.send('go', lines.join('\n')); const a = key(h); const rr = await h.sdk.reread(h.ctx.chat.length - 1); return rr.ok && key(h) !== a ? [a, key(h)] : null; }
  finally { h.close(); restore(); }
}
let lines = fs.readFileSync(process.argv[2], 'utf8').split('\n');
if (!(await bad(lines))) { console.log('does not reproduce in isolation'); process.exit(0); }
let n = 2;
while (lines.length >= 2) {
  const size = Math.ceil(lines.length / n); let reduced = false;
  for (let i = 0; i < lines.length; i += size) {
    const cand = [...lines.slice(0, i), ...lines.slice(i + size)];
    if (await bad(cand)) { lines = cand; n = Math.max(n - 1, 2); reduced = true; break; }
  }
  if (!reduced) { if (n >= lines.length) break; n = Math.min(lines.length, n * 2); }
}
console.log(JSON.stringify(lines.join('\n')));
console.log(await bad(lines));
