// Final soak (live soak seed 23, reply ~230–300; reproduced here): deleting a reply from the middle of the
// chat skips a LATER reply's rest as a whole. Party pools are stored as whole values (HP cur/max replaced),
// not as changes. A fight won in reply A levels Wessel up (max HP 98 → 102); reply B wounds him and reply C
// rests him back to 102/102. Delete reply A: max goes back to 98, C's stored "cur: 102" no longer validates
// ("HP must be whole numbers with 0 ≤ cur ≤ max"), and C's whole block is skipped: the rest's heal AND its
// claim (rest:<sid>) are gone, Wessel is left at 0 HP although the rest reply is still in the chat. A reload
// replays the same way and the next checkpoint stores it. In the live soak the rest's claim vanished this way
// (store rebuild without validators kept it; the runtime and the live page did not).
// Invariant 2 (a delete restores the state of that point, here the later replies' changes on top of it) and 7.
// Drop into rpg_battle/tests/v2/break/ (with helpers/suite-final.js; the four repos as siblings).
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { started } from './helpers/suite-final.js';

test('final: deleting an earlier reply (a level-up fight) keeps a later reply\'s rest', async t => {
    t.mock.method(console, 'warn', () => {});
    const h = await started();
    t.after(() => h.close());
    // Real ids: the helper's seeded crypto gives every reply the same sid (and so the same claim key).
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true, writable: true });
    const pc = () => h.q('party.pc');
    let fightReply = -1;
    for (let k = 0; k < 15 && pc().level < 2; k++) {
        await h.send('Fight.', h.reply('Rats!', ['! encounter 3 Cellar Rat Swarm — boiling out | tier: weak | stakes: normal']));
        fightReply = h.ctx.chat.length - 1;
        const offer = h.q('combat.offers')[0];
        assert.equal((await h.cmd('combat.start', { offer: offer.id })).ok, true);
        for (let i = 0; i < 80; i++) { const s = h.q('combat.session'); if (!s || s.status !== 'active') break; if (!(await h.cmd('combat.act', { action: { type: 'auto' } })).ok) break; }
        await h.cmd('combat.end', {});
    }
    assert.equal(pc().level, 2, 'the last fight levelled Wessel up');
    await h.send('Ow.', h.reply('A fist.', ['~ wound Wessel — a beating | harm: severe']));
    await h.send('Rest.', h.reply('You sleep.', ['! rest long — in a rented cot']));
    assert.equal(pc().hp.cur, pc().hp.max);

    await h.st.deleteMessage(fightReply);   // the reader deletes that fight's reply from the middle

    assert.deepEqual(h.store.problems().map(problem => problem.why), [], 'no later block is skipped');
    assert.ok(pc().hp.cur > 0, 'the later rest still healed Wessel');
    assert.equal(Object.keys(h.head().meta.claims).filter(key => key.startsWith('rest:')).length, 1, 'the rest\'s claim is kept');
});
