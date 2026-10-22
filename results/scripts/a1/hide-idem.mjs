// capture.js level: reading a reply, hiding it, and reading the hidden text again must give the same lines
// (what the live capture reads == what a Re-read of the saved text reads). Known classes excluded: "--" (B-a1-11),
// block tags inside a line (B-a1-12).
const { extractBlock, hideBlock, parseChanges } = await import('/home/user/cell/a1/Story_block/src/v2/capture.js');
const heads = new Set(['+ coin', '- coin', '+ present', '- present', '! encounter', '+ item', '- item', '? choice', '~ chatter', '! time']);
let x = Number(process.argv[2] ?? 1);
const r = () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(r() * a.length)];
const lines = ['+ coin 5', '+ present Kael', '- present Kael', '! encounter 2 Rat — pack | tier: weak', '+ item Rope | qty: 2', '? choice Run', '~ chatter Fenna: hm', '! time +2h', '+ Coin 5', '+coin 5', '- coin 3', '* + coin 2', '**+ item Torch**'];
const prose = ['The hall is long.', 'She waits.', '"+ coin 5," she said.', 'Rain.', 'He lists: rope, salt.', '> + coin 9', 'Fenna nods. + coin 3'];
const para = () => Array.from({ length: 1 + Math.floor(r() * 3) }, () => (r() < 0.35 ? pick(lines) : pick(prose))).join('\n');
const block = () => `<Changes>\n${Array.from({ length: 1 + Math.floor(r() * 3) }, () => pick(lines)).join('\n')}${r() < 0.85 ? '\n</Changes>' : ''}`;
let n = 0, bad = 0; const ex = [];
for (let i = 0; i < Number(process.argv[3] ?? 20000); i++) {
  const parts = Array.from({ length: 1 + Math.floor(r() * 7) }, () => (r() < 0.25 ? block() : r() < 0.08 ? `<think>\n${para()}\n</think>` : para()));
  let mes = parts.join(r() < 0.8 ? '\n\n' : '\n');
  if (/--|<\/?Changes>[^\n]|[^\n]<\/?Changes>/.test(mes.replace(/^<\/?Changes>$/gm, ''))) continue;
  n++;
  const read = text => { const b = extractBlock(text, 'Changes', null, { heads }); return b === null ? [] : parseChanges(b).lines.map(l => l.raw.trim()); };
  const A = read(mes);
  const H = hideBlock(mes, 'Changes', { heads });
  const B = read(H);
  const H2 = hideBlock(H, 'Changes', { heads });
  if (JSON.stringify(A) !== JSON.stringify(B) || H2 !== H) { bad++; if (ex.length < 4) ex.push({ mes, A, B, idem: H2 === H }); }
}
console.log('cases', n, 'diverging', bad);
for (const e of ex) console.log(JSON.stringify(e).slice(0, 900));
