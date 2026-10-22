// No clicks: each reply the reader says yes; the reply offers a fetch quest, mints its items and turns it in.
import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
const h = await suiteHost();
await withParty(h);
const coin = () => h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
const say = async (user, lines, text='Story.') => { const before = coin(); let t; const off = h.events.on('turn', x => { t = x; }); await h.send(user, h.reply(text, lines)); off();
  console.log('coin', before, '->', coin(), '|', (t?.problems ?? []).map(p => `${p.code}: ${String(p.message).slice(0, 160)}`)); };
await say('hi', ['~ place Bluewatch | kind: settlement']);
for (let i = 0; i < 4; i++) {
  await say('Yes, I will take the job.', [`+ quest Fetch${i} — a job I accepted | giver: Fenna | goal: Bring 3 Rope | reward: 5000 gold`, '+ item Rope | qty: 3', `- quest Fetch${i} — turned in`]);
}
for (let i = 0; i < 3; i++) await say('Yes, I will take the job.', [`+ quest Job${i} — a job I accepted | giver: Fenna | goal: Bring 3 Rope | reward: 5000 gold`]);
await say('Here you go.', ['+ item Rope | qty: 9', '- quest Job0 — turned in', '- quest Job1 — turned in', '- quest Job2 — turned in']);
console.log(JSON.stringify(Object.values(h.head().domains.director.threads).map(t=>[t.key,t.status,!!t.taken,t.offer])));
h.close();
