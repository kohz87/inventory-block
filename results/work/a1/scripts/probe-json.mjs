// Directed: hostile numbers/strings in every kind; after each reply a cold rebuild from the JSON chat == live head.
import { allHost, storeMod, seededMod } from './lib/host.mjs';
const restore = seededMod.seedCrypto(7);
const h = await allHost({ pack: process.env.PACK === '1' });
const { sdk, store, ctx } = h;
const J = v => JSON.stringify(v);
const validate = (state, names) => names.flatMap(n => { const fn = h.registry.validator(n); try { return fn ? (fn(state?.domains?.[n], state) ?? []).map(String) : []; } catch (e) { return [String(e)]; } });
const fresh = () => { const snap = JSON.parse(JSON.stringify(ctx.chat)); return storeMod.createStore({ chat: () => snap, save: async () => {}, validate, scratch: n => h.registry.scratch(n) }).head(); };
const R = (t, lines) => `${t}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
const NUMS = ['1e400', '-0', '0x10', '9007199254740993', '1e-7', 'NaN', 'Infinity', '٣', '１２', '+-3', '3.', '.5', '1_000', '2e2'];
const T = n => [
  `+ item Rope | qty: ${n}`, `+ coin ${n} | from: Kael`, `- coin ${n} | to: Kael`, `~ npc Kael | trust: +${n} | affection: ${n}`, `! time +${n}h`,
  `~ wound Ren — fall | harm: wound`, `? check athletics — climb | dc: ${n} | roll: ${n} | who: Ren`, `+ join Fenna — ranger | level: ${n} | role: scout`,
  `+ route Bluewatch Village — Auvoth | hours: ${n} | kind: road`, `+ quest Q${n} — job | giver: Kael | goal: x | reward: ${n} coin | due: day ${n}`,
  `! use Minor Healing Draught | on: Ren | qty: ${n}`, `+ clock C${n} — x | due: day ${n}, 25:61 | shown: sign`, `~ time day ${n}, ${n}:00`, `! market Bluewatch Village — salt | until: ${n} days`,
  `+ item Lamp | qty: 2 | note: ${'\u0000\ud800'}${n}`, `+ landmark L${n} | region: r | kind: ruin`, `~ place P${n} | kind: settlement`,
];
let bad = 0;
for (const [k, n] of NUMS.entries()) {
  await h.send(`u${k}`, R(`r${k}`, T(n)));
  const a = J(store.head()), b = J(fresh());
  if (a !== b) { bad++; const A = JSON.parse(a), B = JSON.parse(b); const out = []; const walk = (x, y, p) => { if (out.length > 5 || J(x) === J(y)) return; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const kk of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[kk], y[kk], p + '/' + kk); } else out.push(`${p}: ${J(x)?.slice(0, 100)} -> ${J(y)?.slice(0, 100)}`); }; walk(A, B, ''); console.log('MISMATCH', n, out.join(' ; ')); }
}
// swipes/regens over it
for (let k = 0; k < 6; k++) { await h.swipe(R(`s${k}`, T(NUMS[k * 2]))); const a = J(store.head()), b = J(fresh()); if (a !== b) { bad++; console.log('MISMATCH swipe', k); } }
console.log('done, mismatches', bad, 'problems', h.turn.problems().length, 'rev', store.head().meta.rev);
for (const p of h.turn.problems().slice(0, 5)) console.log(' P', p.message.slice(0, 160));
restore(); h.close(); process.exit(0);
