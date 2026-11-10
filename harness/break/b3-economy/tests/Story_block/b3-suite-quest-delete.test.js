// B-b3-8 (whole suite): with RPG Battle, Story Director and NPC State Delta on and the Ersveil pack
// installed, the middle-delete dupe pays a quest twice: turn the quest in on a reply, let a later
// reply touch the wallet, delete the turn-in's reply — the reward stays, the quest is open again
// (its claim went with the deleted reply), and it pays again.
// Needs the four checkouts side by side (helpers/suite.js finds them); skipped otherwise.
import test from 'node:test';
import assert from 'node:assert/strict';

let suite = null;
try { suite = await import('./helpers/suite.js'); } catch (error) { suite = { error }; }
const skip = suite?.error ? `the four Story Suite checkouts are not side by side: ${suite.error.message}` : false;

async function fight(h) {
    await h.send('We go down.', h.reply('Rats!', ['! encounter 2 Cellar Rat — in the cellar | tier: trivial']));
    const offer = h.q('combat.offers').at(-1);
    assert.equal((await h.cmd('combat.start', { offer: offer.id })).ok, true);
    for (let n = 0; n < 200 && h.q('combat.session')?.status === 'active'; n += 1) await h.cmd('combat.act', { action: { type: 'auto' } });
    assert.equal((await h.cmd('combat.end')).ok, true);
}

test('a quest paid on a deleted reply cannot be paid again while its money stays', { skip }, async () => {
    const h = await suite.started({ seed: 3 });
    try {
        await h.send('I take the rat job.', h.reply('Fenna pins the notice.', ['+ quest Granary Rats — the cellar | giver: Fenna | goal: Kill 2 cellar rats | reward: 50 marks']));
        await fight(h);
        await h.send('Back to the Guild office.', 'Fenna counts the tails.');
        const turnIn = h.ctx.chat.length - 1;
        const start = h.wallet();
        assert.equal((await h.cmd('quest.finish', { key: 'Granary Rats' })).ok, true);
        await h.send('On.', h.reply('A coin on the road.', ['+ coin 1']));
        await h.st.deleteMessage(turnIn);
        await h.st.deleteMessage(turnIn - 1);
        const again = await h.cmd('quest.finish', { key: 'Granary Rats' });
        const total = h.wallet() - start;
        assert.ok(total <= 51, `after the delete the quest ${again.ok ? 'paid again' : 'stayed paid'}: the party got ${total} for one 50-mark quest`);
    } finally { h.close(); }
});
