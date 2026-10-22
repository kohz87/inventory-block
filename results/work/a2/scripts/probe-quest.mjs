// Several code-counted (Bring N item) quests turned in by one reply, with the items minted by that reply.
import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const h = await suiteHost();
await withParty(h);
const coin = () => h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
const say = async (lines, text='Story.') => { const before = coin(); let t; const off = h.events.on('turn', x => { t = x; }); await h.send('go', h.reply(text, lines)); off();
  console.log('coin', before, '->', coin(), '| problems:', (t?.problems ?? []).map(p => `${p.code}: ${String(p.message).slice(0, 200)}`)); };
await say(['~ place Bluewatch | kind: settlement']);
const N = Number(process.argv[2] ?? 6);
const L = [];
for (let i = 0; i < N; i++) L.push(`+ quest Fetch${i} — a job | giver: Fenna | goal: Bring 3 Rope | reward: 5000 gold | rank: S`);
await say(L);
for (const t of Object.values(h.head().domains.director.threads)) { const r = await h.cmd('quest.take', { id: t.id }); if (!r.ok) console.log('take', t.key, r.code, r.message); }
const T = ['+ item Rope | qty: 20'];
for (let i = 0; i < N; i++) T.push(`- quest Fetch${i} — turned in`);
await say(T);
console.log(JSON.stringify(Object.values(h.head().domains.director.threads).map(t=>[t.key,t.status,!!t.taken])));
console.log('budget per reply (F top):', JSON.stringify(h.q('quest.ranks')[0]));
h.close();
