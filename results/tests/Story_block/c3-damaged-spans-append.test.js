// C3-6: once a reply's record has spans that do not add up (one op more, e.g. a hand-edited chat), every
// later append to that reply (the reader's actions after it, the system steps before the next reply) is
// stored into the same single block: store.js append writes `spans: [...(spansOf(record) ?? []), new]`,
// and spansOf is null there, so the new span alone still does not add up. Live shows the action; on any
// rebuild (reload, swipe back, delete) the whole block, the action included, is skipped and lost
// (invariants 1 and 7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../../../testkit/index.js';
import { createStore } from '../../../src/v2/store.js';

test('an action taken on a reply whose record is damaged survives a reload', async t => {
    t.mock.method(console, 'warn', () => {});
    const host = await createHost();
    t.after(() => host.close());
    await host.send('One.', 'Reply.\n<Changes>\n+ item Rope\n</Changes>');
    const message = host.ctx.chat.at(-1);
    const record = structuredClone(message.extra.storySuite);
    record.ops.push({ op: 'replace', path: '/domains/scene/nope/x', value: 1 });   // a hand edit: one op the spans do not count
    message.extra.storySuite = record;
    message.swipe_info[message.swipe_id].extra = structuredClone(message.extra);
    await host.st.loadChat(structuredClone(host.ctx.chat));

    const result = await host.sdk.command('scene.present', { add: 'Fenna' });
    assert.equal(result.ok, true);
    assert.deepEqual(host.head().domains.scene.present, ['Fenna']);
    const rebuilt = createStore({ chat: () => structuredClone(host.ctx.chat), save: async () => {} });
    assert.deepEqual(rebuilt.head().domains.scene.present, ['Fenna'], 'replay == live');
    await host.st.loadChat(structuredClone(host.ctx.chat));
    assert.deepEqual(host.head().domains.scene.present, ['Fenna'], 'after a reload');
});
