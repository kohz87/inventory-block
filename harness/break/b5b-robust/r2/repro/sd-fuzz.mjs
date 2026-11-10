import { parseChanges as sd } from '../Story_director/src/changes.js';
import { parseChanges as sb } from '../Story_block/src/v2/capture.js';
const CH = [' ', '-', '|', ':', ',', ';', '—', '.', 'a', '\t', ', ', ': ', '| ', ' -', 'a: ', ', giver', ' — ', 'a ', '(', '[', '*', '**', '`', "'", ', on:', 'on: ', ' |'];
const ms = fn => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const rows = [];
for (const c of CH) for (const [pre, post] of [['+ hook Lost ', 'x — find it | giver: Elke'], ['+ hook Lost — find ', 'x'], ['+ hook Lost — find | giver', 'x'], ['+ hook ', ''], ['~ quest Lost | progress: ', 'x']]) {
  for (const n of [10000, 40000]) {
    const line = pre + c.repeat(Math.ceil(n / c.length)).slice(0, n) + post;
    const a = ms(() => sd(line)), b = ms(() => sb(line));
    rows.push({ c: JSON.stringify(c), pre, n, sd: Math.round(a), sb: Math.round(b) });
  }
}
const bad = rows.filter(r => r.sd > 30 || r.sb > 30);
console.log(bad.length ? bad : 'none over 30ms');
