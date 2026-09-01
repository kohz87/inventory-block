import assert from 'node:assert/strict';
import { attachMessageRevision, createRevision, ensureRoot, rememberBranchHead, resolveActiveRevision } from '../src/state.js';
import { consumeInventorySeed, formatInventorySeedBlock } from '../src/protocol.js';
import { SOURCE } from '../src/constants.js';

for (let n = 0; n < 1000; n++) {
  const state = { categories: [{ name: 'General', items: [{ name: `Item${n}`, quantity: String((n % 17)+1), remark: `Remark ${n}` }] }, { name: `C${n}`, items: [{ name: `X${n}`, quantity: `${(n%5)+1} set`, remark: `${n%30} days` }] }] };
  const r = consumeInventorySeed(formatInventorySeedBlock(state));
  assert.deepEqual(r.state, state);
}

for (let run = 0; run < 200; run++) {
  const c = { chat: [], chatMetadata: {} };
  ensureRoot(c);
  let rev = 0;
  const revBeforeIndex = [];
  for (let i = 0; i < 14; i++) {
    revBeforeIndex[i] = rev;
    if (i % 2 === 0) {
      c.chat.push({ is_user: true, is_system: false, mes: `U${run}-${i}`, extra: {} });
    } else {
      c.chat.push({ is_user: false, is_system: false, mes: `A${run}-${i}`, extra: {} });
      const next = createRevision(c, { categories: [{ name: 'General', items: [{ name: 'Counter', quantity: String(i), remark: '' }] }] }, { parent: rev, source: SOURCE.LLM });
      attachMessageRevision(c, i, { baseRevision: rev, revision: next, newUid: true });
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
console.log('hardpass fuzz: ok');
