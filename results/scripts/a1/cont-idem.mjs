// Continue at capture.js level: live = lines read from the reply (hidden) + lines the Continue reads from its own
// text; Re-read = lines read from the whole saved text. Divergences are printed by class.
const { extractBlock, hideBlock, parseChanges, continuation } = await import('/home/user/cell/a1/Story_block/src/v2/capture.js');
const heads = new Set(['+ coin', '- coin', '+ present', '- present', '! encounter', '+ item', '? choice', '~ chatter', '! time']);
let x = Number(process.argv[2] ?? 1);
const r = () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(r() * a.length)];
const lines = ['+ coin 5', '+ present Kael', '- present Kael', '! encounter 2 Rat — pack | tier: weak', '+ item Rope | qty: 2', '? choice Run', '! time +2h', '+ Coin 5'];
const prose = ['The hall is long.', 'She waits.', 'Rain.', 'Fenna nods.'];
const para = () => Array.from({ length: 1 + Math.floor(r() * 2) }, () => (r() < 0.35 ? pick(lines) : pick(prose))).join('\n');
const block = (close = true) => `<Changes>\n${Array.from({ length: 1 + Math.floor(r() * 2) }, () => pick(lines)).join('\n')}${close ? '\n</Changes>' : ''}`;
const text = k => Array.from({ length: k }, () => (r() < 0.3 ? block(r() < 0.85) : para())).join('\n\n');
const read = (t, at = null) => { const b = extractBlock(t, 'Changes', at, { heads }); return b === null ? [] : parseChanges(b).lines.map(l => l.raw.trim()); };
let n = 0; const classes = {}; const ex = {};
for (let i = 0; i < Number(process.argv[3] ?? 5000); i++) {
  const reply = text(1 + Math.floor(r() * 4));
  const live1 = read(reply);
  const saved = hideBlock(reply, 'Changes', { heads });
  const added = (r() < 0.5 ? '\n\n' : ' ') + text(1 + Math.floor(r() * 5));
  const full = saved + added;
  const at = continuation(saved, full);
  const live2 = read(full, at);
  const saved2 = hideBlock(full, 'Changes', { ...at, heads });
  const reread = read(saved2);
  n++;
  const a = JSON.stringify([...live1, ...live2].sort()), b = JSON.stringify([...reread].sort());
  if (a !== b) {
    // B-a1-10: the Re-read reads every line the live capture read, plus story lines of the Continue's text
    // that sit after the reply's first hidden comment (Re-read's anchor) and were too far up for the Continue.
    const extra = [...reread]; for (const l of [...live1, ...live2]) { const k = extra.indexOf(l); if (k >= 0) extra.splice(k, 1); }
    const superset = extra.length + live1.length + live2.length === reread.length;
    const fromAdded = extra.every(l => added.includes(l));
    const cls = at.tail ? 'tail' : superset && fromAdded && /<!--/.test(saved) ? 'B-a1-10' : 'other';
    classes[cls] = (classes[cls] ?? 0) + 1;
    if (!ex[cls]) ex[cls] = { reply, added, live: [...live1, ...live2], reread };
  }
}
console.log('cases', n, 'diverging by class', JSON.stringify(classes));
for (const [k, e] of Object.entries(ex)) console.log(k, JSON.stringify(e).slice(0, 700));
