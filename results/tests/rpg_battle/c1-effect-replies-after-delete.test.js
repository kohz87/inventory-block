// Beta fuzz cell, a1 pass 2 (C1-4): an effect that lasts "N replies" is counted on the CHAT INDEX
// (party/effects.js:164 repliesSince = (now.at - start.at) / 2, `start.at` the chat index of the reply that
// made it, `now.at` the latest dice entry's reply index). When the reader deletes earlier messages after the
// effect was made, every later reply has a smaller index, so the effect lasts as many extra replies as
// messages were deleted (here 4 → a "2 replies" debuff is still on 4 replies later). A group chat (two
// replies in a row, no user message) halves the count the other way. Per-reply bookkeeping keyed on a list
// position (SPEC §2: key by the reply's record ID). Invariant 2/3.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rpgHost, seeded } from '../integration/helpers/host.js';

async function started() {
    const host = await rpgHost();
    assert.equal((await host.cmd('party.create', { name: 'Ren', preset: 'fighter' })).ok, true);
    await host.send('We walk into the village.', host.reply('Bluewatch Village.', ['~ place Bluewatch Village | kind: settlement']));
    return host;
}

async function lastsFor(deleteEarlier) {
    const host = await started();
    try {
        for (let k = 0; k < 4; k++) await host.send(`u${k}`, host.reply(`r${k}`, ['+ coin 1 | from: Kael']));
        await host.send('A chill.', host.reply('Ren shivers.', ['+ effect Shaken — scared | on: all | for: 2 replies | who: Ren | kind: debuff']));
        assert.equal(host.q('party.effects', {}).length, 1, 'setup: the effect is on');
        if (deleteEarlier) for (let k = 0; k < 4; k++) await host.st.deleteMessage(3);   // two earlier exchanges
        let replies = 0;
        while (replies < 8 && host.q('party.effects', {}).some(e => e.name === 'Shaken')) {
            await host.send(`n${replies}`, host.reply(`n${replies}`, ['+ coin 1 | from: Kael']));
            replies += 1;
        }
        return replies;
    } finally { host.close(); }
}

test('C1-4: a "2 replies" effect lasts as many replies after an earlier exchange is deleted', async t => {
    t.mock.method(console, 'warn', () => {});
    await seeded(4, async () => {
        const plain = await lastsFor(false);
        const afterDelete = await lastsFor(true);
        assert.equal(afterDelete, plain, `without a delete it ends after ${plain} replies; after deleting 4 earlier messages it lasts ${afterDelete}`);
    });
});
