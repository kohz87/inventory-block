// B4r2-5 (Story Block 2f17c2c scene.setPlace, seen through Story Director's quests): a move line
// without `| kind:` keeps the scene's stored kind (scene.js:68-81) even when the place changes, so
// walking from "East Ridge | kind: wild" back to "~ place Bluewatch" makes Bluewatch wild, the
// atlas then files Bluewatch as wild, and a quest can no longer be turned in at the settlement it
// was given in. Needs the testkit synced from Story Block 2f17c2c (npm run sync-testkit): with
// the vendored da54eaf testkit the kind was cleared on a move and this passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../../vendor/story-block/testkit/index.js';
import { createModule } from '../../../src/v2/module.js';
import { fakeRpgBattle } from '../integration/helpers/fake-rpg.js';

const said = (text, lines) => `${text}\n<Changes>\n${lines.join('\n')}\n</Changes>`;

test('B4r2-5: moving to another place without a kind does not carry the old place\'s kind there', async () => {
    const host = await createHost({ modules: [fakeRpgBattle(), createModule()] });
    try {
        await host.send('Work?', said('A notice.', ['~ place Bluewatch | kind: settlement', '+ present Fenna',
            '+ quest Lone Wolf — a wolf | giver: Fenna | goal: Kill 1 wolf | reward: 20 gold']));
        assert.equal((await host.sdk.command('quest.take', { key: 'Lone Wolf' })).ok, true);
        await host.send('Out we go.', said('The ridge.', ['~ place East Ridge | kind: wild']));
        await host.send('Back.', said('Back in town.', ['~ place Bluewatch']));
        assert.notEqual(host.head().domains.scene.place.kind, 'wild', 'Bluewatch took East Ridge\'s kind');
        assert.equal(host.sdk.query('atlas.here').kind, 'settlement', 'the atlas now files Bluewatch as wild');
        assert.equal((await host.sdk.command('combat.win', { foes: [{ name: 'Wolf', count: 1 }] })).ok, true);
        const done = await host.sdk.command('quest.finish', { key: 'Lone Wolf' });
        assert.equal(done.ok, true, done.message);
    } finally {
        host.close();
    }
});
