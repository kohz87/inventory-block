import assert from 'node:assert/strict';
import {
  attachMessageRevision,
  commitManualState,
  createRevision,
  ensureRoot,
  getCurrentInventory,
  rememberBranchHead,
  resolveActiveRevision,
} from '../src/state.js';
import { consumeInventorySeed, formatInventorySeedBlock } from '../src/protocol.js';
import { EXTRA_KEY, LIMITS, SOURCE } from '../src/constants.js';

for (let n = 0; n < 1000; n++) {
  const state = { categories: [
    { name: 'General', items: [{ name: `Item|${n}`, quantity: String((n % 17) + 1), remark: `Remark \\ ${n} | intact` }] },
    { name: `C]${n}`, items: [{ name: `X${n}`, quantity: `${(n % 5) + 1} set`, remark: `${n % 30} days` }] },
  ] };
  const r = consumeInventorySeed(formatInventorySeedBlock(state));
  assert.deepEqual(r.state, state);
}

for (let run = 0; run < 300; run++) {
  const c = { chat: [], chatMetadata: {} };
  ensureRoot(c);
  let rev = 0;
  const revBeforeIndex = [];
  for (let i = 0; i < 18; i++) {
    revBeforeIndex[i] = rev;
    if (i % 2 === 0) {
      c.chat.push({ is_user: true, is_system: false, mes: `U${run}-${i}`, extra: {} });
    } else {
      c.chat.push({ is_user: false, is_system: false, mes: `A${run}-${i}`, extra: {} });
      const next = createRevision(c, { categories: [{ name: 'General', items: [{ name: 'Counter', quantity: String(i + 1), remark: '' }] }] }, { parent: rev, source: SOURCE.LLM });
      attachMessageRevision(c, i, { baseRevision: rev, revision: next, newUid: true, portable: true });
      rev = next;
      rememberBranchHead(c, rev);
    }
  }
  const deleteAt = run % c.chat.length;
  const expected = revBeforeIndex[deleteAt];
  c.chat.splice(deleteAt, 1);
  const actual = resolveActiveRevision(c);
  assert.equal(actual, expected, `run ${run} delete ${deleteAt}`);
}

for (let run = 0; run < 200; run++) {
  const original = { chat: [], chatMetadata: {} };
  ensureRoot(original);
  let rev = 0;
  for (let i = 0; i < 10; i++) {
    original.chat.push({ is_user: i % 2 === 0, is_system: false, mes: `${i % 2 ? 'A' : 'U'}${run}-${i}`, extra: {} });
    if (i % 2) {
      const next = createRevision(original, { categories: [{ name: 'General', items: [{ name: 'Gold', quantity: '1', remark: String(run * 10 + i + 1) }] }] }, { parent: rev, source: SOURCE.LLM });
      attachMessageRevision(original, i, { baseRevision: rev, revision: next, newUid: true, portable: true });
      rev = next;
    }
  }
  if (run % 3 === 0) {
    rev = commitManualState(original, { categories: [{ name: 'General', items: [{ name: 'Gold', quantity: '1', remark: `manual-${run}` }] }] }, { source: SOURCE.MANUAL });
  }
  const branch = { chat: structuredClone(original.chat), chatMetadata: {} };
  ensureRoot(branch);
  assert.deepEqual(getCurrentInventory(branch), getCurrentInventory(original), `portable branch ${run}`);
}

// Stress the branch-head hard cap with unique user lineages.
{
  const c = { chat: [{ is_user: true, is_system: false, mes: 'root', extra: {} }], chatMetadata: {} };
  const root = ensureRoot(c);
  for (let i = 0; i < LIMITS.branchHeads + 200; i++) {
    c.chat[0].mes = `root-${i}`;
    const next = createRevision(c, { categories: [{ name: 'General', items: [{ name: 'Gold', quantity: '1', remark: String(i + 1) }] }] }, { parent: root.activeRevision, source: SOURCE.MANUAL });
    rememberBranchHead(c, next);
  }
  assert.ok(Object.keys(root.branchHeads).length <= LIMITS.branchHeads);
}

// Ensure a selected swipe carries its own portable state when cloned into a branch.
{
  const message = { is_user: false, is_system: false, mes: 'A', swipes: ['A', 'B'], swipe_info: [{}, {}], swipe_id: 0, extra: {} };
  const c = { chat: [message], chatMetadata: {} };
  ensureRoot(c);
  const a = createRevision(c, { categories: [{ name: 'General', items: [{ name: 'Sword', quantity: '1', remark: '' }] }] }, { parent: 0, source: SOURCE.LLM });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: a, newUid: true, portable: true });
  message.swipe_id = 1;
  message.mes = 'B';
  message.extra = {};
  const b = createRevision(c, { categories: [{ name: 'General', items: [{ name: 'Potion', quantity: '1', remark: '' }] }] }, { parent: 0, source: SOURCE.LLM });
  attachMessageRevision(c, 0, { baseRevision: 0, revision: b, newUid: true, portable: true });
  const selected = structuredClone(message);
  selected.swipe_id = 0;
  selected.mes = selected.swipes[0];
  selected.extra = structuredClone(selected.swipe_info[0].extra);
  const branch = { chat: [selected], chatMetadata: {} };
  ensureRoot(branch);
  assert.equal(getCurrentInventory(branch).categories[0].items[0].name, 'Sword');
  assert.ok(branch.chat[0].extra[EXTRA_KEY].checkpoint.state);
}

console.log('hardpass fuzz: ok');
