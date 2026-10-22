import { allHost } from './lib/host.mjs';
const h = await allHost({ pack: true });
const c = async (t,p) => { const r = await h.sdk.command(t,p); console.log(t, JSON.stringify(p), '->', r.ok, r.code ?? '', (r.message??'').slice(0,120)); return r; };
await c('party.create', { name: 'Ren', preset: 'fighter' });
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
await h.send('hi', R('ok', ['+ item Crag Wolf Pelt | qty: 4', '+ coin 300 | from: Kael', '+ hook Rat job — rats | giver: Marrit | reward: 30 coin', '+ quest Find Lamp — a job | giver: Kael | goal: get it | reward: 10 coin | rank: F', '~ npc Kael | trust: +5', '+ join Fenna — a ranger | level: 2 | role: scout', '~ time +2h', '! use Minor Healing Draught | on: Ren', '~ wound Ren — a fall | harm: wound', '~ wound Ren — poisoned', '? check athletics — climb | dc: hard | roll: 2 | result: fail | who: Ren', '+ clock Doom — bad | due: tomorrow, 18:00 | shown: sign', '+ route Bluewatch Village — Auvoth | hours: 5 | kind: road']));
const hd = h.store.head();
for (const [k,v] of Object.entries(hd.domains)) console.log('##', k, JSON.stringify(v).slice(0, 700));
console.log(JSON.stringify(h.sdk.query('trade.market')).slice(0,400));
try { console.log(JSON.stringify(h.sdk.query('trade.stock', { kind: 'Watch Stores' })).slice(0,400)); } catch(e) { console.log('stock', e.message); }
for (const p of h.turn.problems()) console.log('P', p.message);
h.close(); process.exit(0);
