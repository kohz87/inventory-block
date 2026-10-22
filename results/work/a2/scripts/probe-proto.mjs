import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(5);
const P = ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'prototype', 'valueOf'];
const tmpl = [
  n => `+ item ${n}`, n => `- item ${n}`, n => `~ item ${n} | note: x`, n => `+ item Rope | name: ${n}`,
  n => `+ present ${n}`, n => `- present ${n}`, n => `~ place ${n} | kind: settlement`,
  n => `+ hook ${n} — x`, n => `+ quest ${n} — x | giver: ${n} | goal: Kill 2 ${n} | reward: 3 gold`, n => `~ quest ${n} | step: done`, n => `- quest ${n} — done`,
  n => `+ faction ${n} — guild | area: ${n}`, n => `~ faction ${n} — angry`, n => `+ world ${n} — war | state: ongoing | factions: ${n}`,
  n => `+ landmark ${n} | region: ${n} | kind: town`, n => `+ route ${n} — Rope | hours: 2`, n => `+ event ${n} — fair`,
  n => `~ wound ${n} | harm: scratch`, n => `+ join ${n} — a stranger`, n => `+ skill Ren — ${n}: a cut`, n => `! encounter 2 ${n} — growl`, n => `? check ${n} — try | dc: 5 | who: Ren`,
  n => `- leave ${n}`, n => `+ clock ${n} — doom | due: +2h`, n => `+ agenda ${n} — plots | now: ${n}`,
];
const host = await suiteHost();
await withParty(host);
await host.send('hi', host.reply('Hello.', ['~ time June 3, 1200, 08:00 am']));
for (const n of P) {
  const lines = tmpl.map(t => t(n));
  try { await host.send('go', host.reply('S.', lines)); } catch (e) { console.log('THROW', n, e.stack); }
}
const crash = host.turn.problems().filter(p => p.code === 'FAILED' || /Something went wrong|TypeError|Cannot|is not a function|undefined/.test(p.message.split('was not used:')[1] ?? ''));
for (const p of crash) console.log('CRASH', p.code, p.message.slice(0, 250));
const state = JSON.stringify(host.head());
console.log('function text in state:', (state.match(/native code/g) ?? []).length, 'proto keys:', (state.match(/"__proto__"/g) ?? []).length);
console.log('Object.prototype polluted?', Object.keys(Object.prototype), ({}).polluted);
const live = JSON.stringify(host.head()); host.store.rebuild(); console.log('rebuild equal', live === JSON.stringify(host.head()));
await host.send('next', 'ok');
console.log(host.tails().at(-1).slice(0, 1500));
const codes = {}; for (const p of host.turn.problems()) codes[p.code] = (codes[p.code] ?? 0) + 1; console.log(codes);
