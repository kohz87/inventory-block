// Round-2 directed probes. BREAK_ROOT=/home/user/_break/b1-capture-r2 node probe-r2.mjs [names]
import { suiteHost, withParty, seedCrypto } from './suite-host.mjs';
console.warn = () => {};
seedCrypto(21);
const R = (h, t, l) => h.reply(t, l);
const coin = h => h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
const probs = (h, n = 6) => h.turn.problems().slice(-n).map(p => `${p.code}: ${p.message.slice(0, 170)}`);
async function fresh(first = []) { const h = await suiteHost(); await withParty(h); await h.send('hi', R(h, 'Hello.', first)); return h; }
const T = {};

T.sellMint = async () => {
  const h = await fresh(['~ place Bluewatch | kind: settlement']);
  const lines = Array.from({ length: 150 }, (_, i) => `+ item Superior Healing Potion ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26)} | qty: 20`);
  await h.send('loot', R(h, 'A potion shop explodes.', lines));
  const inv = h.head().domains.inventory;
  let total = 0, sold = 0, refused = {};
  for (const s of Object.values(inv.stacks)) {
    const r = await h.cmd('trade.sell', { stack: s.id, qty: s.qty });
    if (r.ok) { sold += s.qty; } else refused[r.code + ' ' + r.message.slice(0, 80)] = (refused[r.code + ' ' + r.message.slice(0, 80)] ?? 0) + 1;
  }
  console.log('sellMint: stacks', Object.keys(inv.stacks).length, 'items sold', sold, 'coin', coin(h), 'refused', JSON.stringify(refused).slice(0, 300));
  console.log('   ', probs(h, 3));
};

T.questMint = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am', '~ place Bluewatch | kind: settlement']);
  const lines = [];
  for (let i = 0; i < 40; i++) lines.push(`+ quest Errand ${i} — small job | giver: Fenna | goal: Find the ring ${i} | reward: 5000 gold`);
  await h.send('Any work? I accept all of them.', R(h, 'Fenna has jobs.', lines));
  const threads = Object.values(h.head().domains.director.threads);
  console.log('questMint: quests', threads.length, 'taken', threads.filter(t => t.taken).length, 'rewards', JSON.stringify(threads.slice(0, 2).map(t => t.reward)));
  await h.send('I take all the errands.', R(h, 'ok', []));
  const l2 = [];
  for (let i = 0; i < 40; i++) l2.push(`~ quest Errand ${i} | met: yes`, `- quest Errand ${i} — turned in`);
  await h.send('I turn them all in.', R(h, 'Fenna pays for each.', l2));
  console.log('   coin after turn-ins', coin(h), 'ended', Object.values(h.head().domains.director.threads).filter(t => t.ended).length);
  console.log('   ', probs(h, 4));
  for (const t of threads.slice(0, 2)) { const r = await h.cmd('quest.finish', { id: t.id }); console.log('   finish cmd', r.ok, r.code, r.message?.slice(0, 120) ?? r.receipt.summary); }
  console.log('   coin', coin(h));
};

T.unclosed = async () => {
  const h = await fresh();
  await h.send('x', 'You find things.\n\n<Changes>\n+ item Rope\n+ item Torch');
  console.log('unclosed (complete last line, no newline):', h.q('inventory.items').map(i => i.name), probs(h, 2));
  await h.send('y', 'More.\n\n<Changes>\n+ item Lamp\n+ item Map\n');
  console.log('unclosed (trailing newline):', h.q('inventory.items').map(i => i.name));
};

T.staleTally = async () => {
  const h = await fresh();
  // fill chat so that deleting earlier messages shifts the next reply onto a used key
  await h.send('a', R(h, 'A.', ['+ coin 1000']));            // reply index 2 -> key "2:0"? (greeting 0, user 1, reply 2)
  const idx = h.store.headIndex();
  console.log('staleTally: first coin reply at', idx, 'tally', JSON.stringify(h.head().domains.inventory.perReply));
  await h.st.deleteMessage(1); await h.st.deleteMessage(0); // now that reply sits at index 0
  await h.send('b', R(h, 'B.', ['+ coin 500']));           // user at 1, reply at 2 -> key "2:0" again
  console.log('   new reply at', h.store.headIndex(), 'coin', coin(h), 'tally', JSON.stringify(h.head().domains.inventory.perReply), probs(h, 2));
};

T.labels = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am']);
  const lines = ['+ hook Rats | constructor: x', '+ hook Bats | prototype: y', '+ hook Cats | ownerid: z | stack_id: q | rev: 5 | meta: m',
    '~ npc Fenna | trust: +5 | qty: 3', '~ npc Brom | trust: +5 | constructor: x', '~ npc Lyra | affection: +5 | id: lyra-1', '~ npc Ren | trust: +5',
    '+ item Rope | constructor: x | prototype: y', '~ place Bluewatch | kind: settlement | constructor: x', '+ join Kael — archer | constructor: x | prototype: y',
    '? check stealth — sneak | dc: normal | constructor: x', '! encounter 2 Wolf — growl | constructor: x'];
  await h.send('go', R(h, 'S.', lines));
  for (const p of h.turn.problems()) console.log('labels P', p.code, p.message.slice(0, 200));
  console.log('labels: npc', JSON.stringify(h.head().domains.npc).slice(0, 400));
};

T.happenedLong = async () => {
  const h = await fresh(['~ place Bluewatch | kind: settlement']);
  const long = 'x'.repeat(1990);
  const lines = [`? check stealth — ${long} | dc: normal`, `? check athletics — ${long} | dc: normal`, `! rest short — ${long}`, `! rest long — ${long}`, `! use Rope — ${long} | on: Ren`, `~ npc Fenna — ${long} | trust: +5`, `+ quest ${'Q'.repeat(1990)} | giver: ${long} | goal: Find ${long} | reward: 5 gold`];
  await h.send('go', R(h, 'S.', lines));
  await h.send('next', 'ok');
  const tail = h.tails().at(-1);
  console.log('happenedLong: tail tokens', Math.ceil(tail.length / 4), 'longest line', Math.max(...tail.split('\n').map(l => l.length)));
};

T.capTiming = async () => {
  for (const kind of ['quest', 'landmark', 'route', 'npc', 'itemU', 'use']) {
    const h = await fresh(['~ time June 3, 1200, 08:00 am', '~ place Bluewatch | kind: settlement']);
    let k = 0; const times = [];
    for (let r = 0; r < 6; r++) {
      const lines = Array.from({ length: 150 }, () => { k++; return {
        quest: `+ quest Q${k} — job | giver: G | goal: Kill 3 rats | reward: 5 gold`,
        landmark: `+ landmark L${k} | region: R${k % 7} | kind: town`,
        route: `+ route A${k} — B${k} | hours: 2 | kind: road`,
        npc: `~ npc Person ${k} | trust: +5 | affection: -3`,
        itemU: `+ item Thing ${k}`,
        use: `! use Thing ${k} | on: Ren`,
      }[kind]; });
      const t0 = performance.now();
      await h.send('go', R(h, 'S.', lines));
      const t1 = performance.now();
      await h.send('n', 'Quiet.');
      times.push(`${(t1 - t0).toFixed(0)}/${(performance.now() - t1).toFixed(0)}`);
    }
    console.log(`capTiming ${kind}: capture/plain ms per round`, times.join(' '), 'chat MB', (JSON.stringify(h.ctx.chat).length / 1e6).toFixed(2));
    h.close();
  }
};

T.continueBypass = async () => {
  const h = await fresh();
  await h.send('x', R(h, 'Coins.', ['+ coin 1000']));
  for (let i = 0; i < 3; i++) await h.cont(`\nMore coins.\n<Changes>\n+ coin 1000\n</Changes>`);
  console.log('continueBypass: coin after 1 reply + 3 continues', coin(h), probs(h, 3));
  for (let i = 0; i < 3; i++) await h.cont(`\nMore lines.\n<Changes>\n${Array.from({ length: 150 }, (_, j) => `+ item Junk${i}x${j}`).join('\n')}\n</Changes>`);
  console.log('   items after 3 continues of 150 lines', h.q('inventory.items').length);
};

T.reread = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am']);
  await h.send('a', R(h, 'A.', ['+ coin 100', '+ item Rope | qty: 3', '+ hook Rats — x', '? check stealth — sneak | dc: normal | roll: 1 | result: success']));
  const idxA = h.store.headIndex();
  await h.send('b', R(h, 'B.', ['- item Rope | qty: 3', '- coin 100']));
  const before = JSON.stringify(h.head().domains);
  const r = await h.sdk.reread(idxA);
  const after = JSON.stringify(h.head().domains);
  console.log('reread middle:', r.ok, r.code, r.message?.slice(0, 150), 'same domains', before === after);
  if (before !== after) {
    const a = JSON.parse(before), b = JSON.parse(after);
    for (const d of Object.keys(a)) if (JSON.stringify(a[d]) !== JSON.stringify(b[d])) console.log('   diff in', d, JSON.stringify(a[d]).slice(0, 200), '\n   =>', JSON.stringify(b[d]).slice(0, 200));
  }
  const live = JSON.stringify(h.head()); h.store.rebuild(); console.log('   rebuild == live', live === JSON.stringify(h.head()));
  // edit the middle reply to give more, then reread
  const m = h.ctx.chat[idxA];
  m.mes = m.mes.replace('+ item Rope | qty: 3', '+ item Rope | qty: 1'); m.swipes[m.swipe_id ?? 0] = m.mes;
  const r2 = await h.sdk.reread(idxA);
  console.log('   reread after edit (later reply removes 3 ropes):', r2.ok, r2.code, r2.message?.slice(0, 200));
};

T.rereadHead = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am', '~ place Bluewatch | kind: settlement']);
  await h.send('a', R(h, 'A.', ['+ coin 40', '+ item Rope | qty: 3', '+ hook Rats — x', '? check stealth — sneak | dc: hard | roll: 1 | result: success', '! encounter 2 Wolf — growl', '~ npc Fenna | trust: +5', '+ join Kael — archer']));
  const idx = h.store.headIndex();
  const before = h.head().domains;
  const r = await h.sdk.reread(idx);
  const after = h.head().domains;
  console.log('rereadHead:', r.ok, r.code, r.message?.slice(0, 120));
  for (const d of Object.keys(before)) if (JSON.stringify(before[d]) !== JSON.stringify(after[d])) console.log('   changed', d, '\n     ', JSON.stringify(before[d]).slice(0, 260), '\n   =>', JSON.stringify(after[d]).slice(0, 260));
  const r2 = await h.sdk.reread(idx);
  console.log('   second reread', r2.ok, 'coin', coin(h));
  // a UI action on the head, then reread
  const st = Object.values(h.head().domains.inventory.stacks)[0];
  const sold = await h.cmd('trade.sell', { stack: st.id, qty: 1 });
  const r3 = await h.sdk.reread(idx);
  console.log('   sell then reread:', sold.ok, r3.ok, r3.code, r3.message?.slice(0, 160));
};
T.ninesThreads = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am']);
  const lines = []; for (let i = 0; i < 150; i++) lines.push(`+ ${['hook','quest','agenda','clock','secret','beat','event'][i % 7]} T${i} — x${i % 7 === 1 ? ' | giver: G | goal: Kill 2 rats | reward: 5 gold' : ''}`);
  await h.send('go', R(h, 'S.', lines));
  const c = {}; for (const p of h.turn.problems()) c[p.code] = (c[p.code] ?? 0) + 1;
  console.log('threads per reply:', Object.keys(h.head().domains.director.threads).length, JSON.stringify(c), probs(h, 1));
  for (let r = 0; r < 10; r++) await h.send('go', R(h, 'S.', Array.from({ length: 30 }, (_, i) => `+ hook R${r}x${i} — x`)));
  console.log('   threads after 10 more replies', Object.keys(h.head().domains.director.threads).length);
};

T.threadDrop = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am']);
  await h.send('go', R(h, 'S.', Array.from({ length: 40 }, (_, i) => `+ hook T${i} — x`)));
  console.log('threadDrop: threads', Object.keys(h.head().domains.director.threads).length, 'host problems', h.turn.problems().length, 'director problems', Object.values(h.head().domains.director.problems).slice(-3).map(p => p.text));
};
T.growth = async () => {
  const h = await fresh(['~ time June 3, 1200, 08:00 am']);
  for (let r = 0; r < 40; r++) {
    await h.send('go', R(h, 'S.', Array.from({ length: 16 }, (_, i) => `+ quest Q${r}x${i} — job | giver: G | goal: Kill 3 rats | reward: 5 gold`)));
    if (r % 8 === 7) { const t = performance.now(); await h.send('n', 'Quiet.'); console.log(`growth: threads=${Object.keys(h.head().domains.director.threads).length} plain reply ${(performance.now() - t).toFixed(0)}ms chat ${(JSON.stringify(h.ctx.chat).length / 1e6).toFixed(1)}MB`); }
  }
};

T.npcEdges = async () => {
  const h = await fresh();
  await h.send('go', R(h, 'S.', Array.from({ length: 90 }, (_, i) => `~ npc Person ${i} | trust: +5`)));
  console.log('npcEdges: npcs', Object.keys(h.head().domains.npc.npcs).length, probs(h, 2));
  await h.send('go', R(h, 'S.', Array.from({ length: 40 }, (_, i) => `~ npc Person ${i} | wibble: +5 | trust: banana`)));
  const idx = h.store.headIndex();
  await h.send('go2', R(h, 'S.', ['~ npc Person 1 | wibble: +5']));
  console.log('   npc problems', h.head().domains.npc.problems?.length, 'ops bytes for one bad npc line', JSON.stringify(h.store.opsAt(h.store.headIndex())).length, probs(h, 2));
  await h.send('go3', R(h, 'S.', ['~ npc Person 1 | trust: +1e309', '~ npc Person 2 | trust: +999999', '~ npc Person 3 | trust: -0x10', '~ npc Person 4 | trust: NaN', '~ npc Person 5 | trust: +½', '~ npc Person 6 | trust: 50']));
  const n = h.head().domains.npc.npcs; console.log('   meters', ['person-1','person-2','person-3','person-4','person-5','person-6'].map(k => JSON.stringify(n[k]?.meters?.trust)).join(' '), probs(h, 6));
};
T.market = async () => {
  const h = await fresh(['~ place Constructor | kind: settlement']);
  await h.send('x', R(h, 'S.', ['! market constructor — no bread', '~ market constructor — supplies back', '! market __proto__ — x', '! market toString — y']));
  console.log('market:', probs(h, 4));
  console.log('   quote at Constructor', JSON.stringify(h.q('trade.market')).slice(0, 300));
};

T.tildeQty = async () => {
  const h = await fresh(['~ place Bluewatch | kind: settlement']);
  await h.send('x', R(h, 'S.', ['+ item Healing Draught', '~ item Healing Draught | qty: 999999']));
  const inv = h.head().domains.inventory;
  const st = Object.values(inv.stacks)[0];
  console.log('tildeQty: qty', st?.qty, probs(h, 2));
  const r = await h.cmd('trade.sell', { stack: st.id, qty: st.qty });
  console.log('   sell all', r.ok, r.message ?? r.receipt.summary, 'coin', coin(h));
};

const want = process.argv.slice(2);
for (const [name, fn] of Object.entries(T)) {
  if (want.length && !want.includes(name)) continue;
  try { await fn(); } catch (e) { console.log(name, 'THREW', e.stack?.split('\n').slice(0, 4).join(' | ')); }
}
