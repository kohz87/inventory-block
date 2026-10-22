// Display kinds at the pure level: the lines one capture keeps (readDisplayLine over the reply's lines in
// order, as turn.js does) == what displayLines shows from the hidden text, for random replies with
// display lines in blocks and in the story near them.
const { extractBlock, hideBlock, parseChanges } = await import('/home/user/cell/a1/Story_block/src/v2/capture.js');
const { EXTRA_KINDS, readDisplayLine, displayLines } = await import('/home/user/cell/a1/Story_block/src/v2/extras.js');
const heads = new Set(['? choice', '~ chatter', '+ coin']);
const entryOf = w => (EXTRA_KINDS[String(w).toLowerCase()] ? { kind: String(w).toLowerCase(), display: EXTRA_KINDS[String(w).toLowerCase()].display, off: false } : null);
let x = Number(process.argv[2] ?? 1);
const r = () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(r() * a.length)];
const lines = ['? choice Run', '? choice Climb the wall', '? choice', '~ chatter Fenna: hm', '~ chatter : x', '~ chatter Kael — *grr*', '+ coin 3', '? choice ' + 'x'.repeat(90)];
const prose = ['Rain.', 'She waits.'];
const para = () => Array.from({ length: 1 + Math.floor(r() * 2) }, () => (r() < 0.4 ? pick(lines) : pick(prose))).join('\n');
const block = () => `<Changes>\n${Array.from({ length: 1 + Math.floor(r() * 4) }, () => pick(lines)).join('\n')}\n</Changes>`;
let n = 0, bad = 0; const ex = [];
for (let i = 0; i < Number(process.argv[3] ?? 10000); i++) {
  const mes = Array.from({ length: 1 + Math.floor(r() * 4) }, () => (r() < 0.4 ? block() : para())).join('\n\n');
  const b = extractBlock(mes, 'Changes', null, { heads });
  const parsed = b === null ? [] : parseChanges(b).lines;
  const counts = new Map(); const live = {};
  for (const line of parsed) { const e = entryOf(line.kind); if (!e) continue; const v = readDisplayLine(e, line, counts); if (v.ok) (live[e.kind] ??= []).push(v.value); }
  const shown = displayLines(hideBlock(mes, 'Changes', { heads }), { entryOf, max: 150 });
  n++;
  if (JSON.stringify(live) !== JSON.stringify(shown)) { bad++; if (ex.length < 2) ex.push({ mes, live, shown }); }
}
console.log('cases', n, 'diverging', bad); for (const e of ex) console.log(JSON.stringify(e).slice(0, 700));
