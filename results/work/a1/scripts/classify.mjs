// Aggregates out/<tag>-*.json: violations by signature, steps run, op mix, UI command outcomes, kind picks.
import fs from 'node:fs';
const dir = process.argv[2] ?? 'out', tag = process.argv[3] ?? '';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f.startsWith(tag));
const sig = {}, ops = {}, cmds = {}; let seeds = 0, steps = 0;
for (const f of files) {
    const j = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
    const [from, to, n] = j.args.map(Number); seeds += to - from + 1; steps += (to - from + 1) * n;
    for (const v of j.violations) { const k = v.what.replace(/\d+/g, 'N'); (sig[k] ??= []).push(`${v.seed}@${v.step}:${v.op}`); }
    for (const [k, c] of Object.entries(j.ops ?? {})) ops[k] = (ops[k] ?? 0) + c;
    for (const [k, c] of Object.entries(j.cmdStats ?? {})) { const t = (cmds[k] ??= { ok: 0, no: 0 }); t.ok += c.ok; t.no += c.no; }
}
console.log(`files ${files.length}, seeds ${seeds}, steps ${steps}`);
console.log('ops', JSON.stringify(ops));
console.log('ui', Object.entries(cmds).map(([k, c]) => `${k} ${c.ok}/${c.ok + c.no}`).join(', '));
for (const [k, l] of Object.entries(sig).sort((a, b) => b[1].length - a[1].length)) console.log(`${l.length}\t${k}\t${l.slice(0, 8).join(' ')}`);
