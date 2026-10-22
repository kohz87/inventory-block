// Times every regex literal (and new RegExp('const')) in the given files against long benign inputs.
// Each regex runs in a worker with a 30 s limit, so an exponential one cannot hang the scan.
import * as espree from '/opt/node22/lib/node_modules/eslint/node_modules/espree/dist/espree.cjs';
import fs from 'node:fs';
import { Worker } from 'node:worker_threads';

const files = process.argv.slice(2);
const found = [];
function walk(node, file) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(n => walk(n, file)); return; }
    if (node.type === 'Literal' && node.regex) found.push({ file, line: node.loc.start.line, pattern: node.regex.pattern, flags: node.regex.flags });
    if (node.type === 'NewExpression' && node.callee?.name === 'RegExp' && node.arguments[0]?.type === 'Literal' && typeof node.arguments[0].value === 'string')
        found.push({ file, line: node.loc.start.line, pattern: node.arguments[0].value, flags: node.arguments[1]?.value ?? '' });
    for (const key of Object.keys(node)) if (key !== 'loc' && key !== 'range') walk(node[key], file);
}
for (const file of files) walk(espree.parse(fs.readFileSync(file, 'utf8'), { ecmaVersion: 2024, sourceType: 'module', loc: true }), file);

const WORKER = String.raw`
const { parentPort, workerData } = require('node:worker_threads');
const CHARS = [' ', '-', '|', ':', 'a', '.', ',', '\t', '<', '#', '*', '0', '—', '(', '[', '"', "'", '=', '/', '\n', '+', '~', '!', '?', '{', '&', ';', 'A', 'é'];
const PAIRS = ['a ', '- ', ': ', '| ', 'a:', '<a', '&#', '{{', 'a-', 'a,', 'a|', ' -', '1.', 'ab', '0 ', 'a\n', '\t ', ' |', '—a', 'a.', ': a', '| a: ', 'a b ', '+ a ', '(a', '[a', 'a=', '/a', 'A ', 'Ab ', ', a', '1 '];
const re = new RegExp(workerData.pattern, workerData.flags);
const time = s => { const t = process.hrtime.bigint(); if (re.global || re.sticky) { re.lastIndex = 0; s.replace(re, ''); } else re.exec(s); return Number(process.hrtime.bigint() - t) / 1e6; };
let worst = { ms: 0 };
for (const c of [...CHARS, ...PAIRS]) for (const wrap of [b => b, b => b + '!\u0001', b => 'x' + b + 'x', b => 'Ab' + b + '\u0001']) {
  const mk = n => wrap(c.repeat(Math.ceil(n / c.length)).slice(0, n));
  const t10 = time(mk(10000));
  if (t10 < 3) continue;
  parentPort.postMessage({ partial: { ms: t10 * 100, t10, input: JSON.stringify(mk(12)), estimate: true } });
  const t100 = time(mk(100000));
  if (t100 > worst.ms) { worst = { ms: t100, t10, input: JSON.stringify(mk(12)) }; parentPort.postMessage({ partial: worst }); }
}
parentPort.postMessage({ done: worst });
`;

const results = [];
for (const r of found) {
    try { new RegExp(r.pattern, r.flags); } catch { continue; }
    const res = await new Promise(resolve => {
        let last = { ms: 0 };
        const w = new Worker(WORKER, { eval: true, workerData: r });
        const timer = setTimeout(() => { w.terminate(); resolve({ ...last, timeout: true }); }, 30000);
        w.on('message', m => { if (m.partial) last = m.partial; if (m.done) { clearTimeout(timer); w.terminate(); resolve(m.done); } });
        w.on('error', e => { clearTimeout(timer); resolve({ ms: 0, error: e.message }); });
    });
    if (res.ms > 50 || res.timeout) results.push({ ...r, ...res });
}
console.log(`regexes: ${found.length}`);
for (const f of results.sort((a, b) => b.ms - a.ms)) {
    console.log(`${f.timeout ? 'TIMEOUT ' : ''}${f.ms.toFixed(0).padStart(7)}ms @100K${f.estimate ? '(est)' : ''} (${(f.t10 ?? 0).toFixed(1)}ms @10K) ${f.file.replace('/home/user/_break/b5b-robust/', '')}:${f.line} /${f.pattern}/${f.flags} input=${f.input}`);
}
