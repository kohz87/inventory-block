const { strayLines, extractBlock, hideBlock } = await import('/home/user/cell/a1/Story_block/src/v2/capture.js');
const heads = new Set(['+ coin', '- coin', '+ present', '! encounter']);
for (const n of [1000, 10000, 40000]) {
  const big = Array.from({ length: n }, (_, i) => (i % 2 ? '+ coin 5' : '+ Coin 5')).join('\n') + '\n\n<Changes>\n+ coin 1\n</Changes>';
  let t = performance.now(); const r = strayLines(big, heads); const a = performance.now() - t;
  t = performance.now(); hideBlock(big, 'Changes', { heads }); const b = performance.now() - t;
  const paras = Array.from({ length: n }, () => 'Story.\n').join('\n') + '+ coin 5\n<Changes>\n</Changes>';
  t = performance.now(); strayLines(paras, heads); const c = performance.now() - t;
  const nested = '<think>'.repeat(n / 10) + '+ coin 5\n' + '</think>'.repeat(n / 10);
  t = performance.now(); strayLines(nested, heads); const d = performance.now() - t;
  console.log(n, 'lines', big.length, 'bytes: strayLines', a.toFixed(0), 'ms hide', b.toFixed(0), 'ms; paragraphs', c.toFixed(0), 'ms; nested think', d.toFixed(0), 'ms; taken', r.taken.length, 'problems', r.problems.length);
}
