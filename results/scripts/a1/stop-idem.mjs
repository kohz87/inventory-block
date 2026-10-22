// Stopped replies at capture.js level: lines read live (stopped) vs lines a Re-read reads from the saved text.
const { extractBlock, hideBlock, parseChanges } = await import('/home/user/cell/a1/Story_block/src/v2/capture.js');
const heads = new Set(['+ coin', '- coin', '+ present', '- present', '! encounter', '+ item', '? choice', '! time']);
let x = Number(process.argv[2] ?? 1);
const r = () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(r() * a.length)];
const lines = ['+ coin 5', '+ present Kael', '- present Kael', '+ item Rope | qty: 2', '? choice Run', '! time +2h', '+ coin 1'];
const prose = ['The hall is long.', 'She waits.', 'Rain.'];
const para = () => Array.from({ length: 1 + Math.floor(r() * 2) }, () => (r() < 0.4 ? pick(lines) : pick(prose))).join('\n');
const block = () => `<Changes>\n${Array.from({ length: 1 + Math.floor(r() * 2) }, () => pick(lines)).join('\n')}${r() < 0.6 ? '\n</Changes>' : ''}`;
const read = (t, o = {}) => { const b = extractBlock(t, 'Changes', null, { heads, ...o }); return b === null ? [] : parseChanges(b).lines.map(l => l.raw.trim()); };
let n = 0; const cls = {}; const ex = {};
for (let i = 0; i < Number(process.argv[3] ?? 10000); i++) {
  const reply = Array.from({ length: 1 + Math.floor(r() * 4) }, () => (r() < 0.3 ? block() : para())).join('\n\n');
  const live = read(reply, { stopped: true });
  const saved = hideBlock(reply, 'Changes', { heads, stopped: true });
  const again = read(saved);
  n++;
  if (JSON.stringify(live) !== JSON.stringify(again)) {
    const lastLine = reply.trimEnd().split('\n').at(-1);
    const k = /<Changes>(?![\s\S]*<\/Changes>)/.test(reply) ? 'open block' : 'stray last line (B-a1-3)';
    cls[k] = (cls[k] ?? 0) + 1; if (!ex[k]) ex[k] = { reply, live, again, lastLine };
  }
}
console.log('cases', n, JSON.stringify(cls)); for (const [k, e] of Object.entries(ex)) console.log(k, JSON.stringify(e).slice(0, 600));
