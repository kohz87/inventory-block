// Confirm soak (C-1, RPG Battle's side): the fix-encounter case itself. A reply writes its encounter line
// in the story on its own line before <Changes> (what fix-encounter was made for) and ALSO lists it in the
// block. Story Block reads both (capture.js strayLines takes the story line, the block has the same line),
// so two fights against the same three rats are offered for one encounter.
// Drops into rpg_battle/tests/v2/break/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rpgHost } from '../integration/helpers/host.js';

test('C-1: one encounter written in the story and in the block offers one fight', async () => {
    const host = await rpgHost();
    try {
        const made = await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
        assert.ok(made.ok, made.message);
        await host.send('We go down.', host.reply('The granary cellar.', ['~ place Watch Granary | kind: settlement']));
        const line = '! encounter 3 Cellar Rat — boiling out of the dark | tier: weak | stakes: normal';
        await host.send('I go down the steps.', `The rats come.\n${line}\n\n<Changes>\n${line}\n</Changes>`);
        const offers = host.q('combat.offers');
        assert.equal(offers.length, 1, `one encounter line (written twice) made ${offers.length} offers: ${offers.map(o => o.id).join(', ')}`);
    } finally { host.close(); }
});
