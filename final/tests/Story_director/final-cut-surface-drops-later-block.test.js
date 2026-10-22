// Final soak (live soak seed 23, testkit fuzz seed 4): deleting a reply from the middle of the chat drops the
// world-line changes of a LATER reply that is still there. Before each reply with more than three open world
// events, chronicle.surface (a system cue stored on the previous carrier) raises chronicle.round and writes
// chronicle.seen whole. A world line in the next reply also writes chronicle.seen whole (pick.js / domain
// slots), with the rounds that cue set. Delete the carrier holding the cue and the round goes back, so the
// next reply's block no longer validates ("chronicle.seen[...] must be a round so far") and is skipped as a
// whole: "- world Salt Tax Riots" is lost (the event is ongoing again), with anything else in that block.
// A reload replays the same way, and the next checkpoint stores the loss. In the live soak the same thing
// took a later reply's `! rest` claim with it. Invariant 2 (a delete restores the state of that point) and 7.
// Drop into Story_director/tests/v2/break/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../../vendor/story-block/testkit/index.js';
import { createModule } from '../../../src/v2/module.js';

const reply = (text, lines = []) => (lines.length ? `${text}\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);

test('final: deleting an earlier reply does not drop a later reply\'s world line (chronicle.seen vs round)', async t => {
    t.mock.method(console, 'warn', () => {});
    let host = null;
    const module = createModule({ host: { settings: id => host?.sdk.settings(id) ?? null, substitute: text => host?.sdk.substitute(text) } });
    host = await createHost({ modules: [module] });
    t.after(() => host.close());
    await host.send('News?', reply('Bad news everywhere.', [
        '~ time June 3, 1200, 08:00 am', '~ place Harrow | kind: settlement',
        '+ world Salt Tax Riots — the salt tax riots | state: ongoing | place: Auvoth',
        '+ world Hill Rains — the hills drown | state: ongoing | place: the northern hills',
        '+ world Wolf Winter — wolves come down | state: ongoing | place: the north marches',
        '+ world Confederacy Levy — every second son | state: ongoing | place: the river',
    ]));
    for (let i = 0; i < 3; i++) await host.send('We wait.', reply('Rain.', ['! time +2h']));
    const cueCarrier = host.ctx.chat.length - 1;
    await host.send('And the riots?', reply('They burn out.', ['- world Salt Tax Riots — the riots burn out']));
    const types = host.ctx.chat[cueCarrier].extra.storySuite.receipts.map(receipt => receipt.type);
    assert.ok(types.includes('chronicle.surface'), 'the carrier before the last reply holds the surface cue');
    const state = name => Object.values(host.head().domains.chronicle.events).find(event => event.name === name)?.state;
    assert.equal(state('Salt Tax Riots'), 'resolved');

    await host.st.deleteMessage(cueCarrier);   // the reader deletes an earlier reply (not the last one)

    assert.deepEqual(host.store.problems().map(problem => problem.why), [], 'no stored change of the later reply is skipped');
    assert.equal(state('Salt Tax Riots'), 'resolved', 'the later reply still ended the riots');
});
