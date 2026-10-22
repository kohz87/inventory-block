// C2-1 (a2 pass 1): a fetch quest ("goal: Bring 3 Rope") counts as code-counted, so its reward is not
// story money (quests/index.js finish: storyMoney = !target && !byPack) and the one-turn-in-a-reply
// rule (wordRule) does not apply. But the Rope it counts can be minted by the same reply's own
// `+ item Rope` line (Story Block's story budget allows 20 of one item), so the story alone pays the
// rank-held reward of as many fetch quests as it likes in one reply, past what one reply may give.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../../vendor/story-block/testkit/index.js';
import { createModule } from '../../../src/v2/module.js';
import { fakeRpgBattle } from '../integration/helpers/fake-rpg.js';

const reply = (text, lines = []) => `${text}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
const wallet = host => host.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;

async function fetchQuests(t, n, rank = '') {
    t.mock.method(console, 'warn', () => {});
    const host = await createHost({ modules: [fakeRpgBattle(), createModule()] });
    t.after(() => host.close());
    await host.send('We arrive.', reply('Bluewatch.', ['~ place Bluewatch | kind: settlement']));
    const names = Array.from({ length: n }, (_, i) => `Fetch ${String.fromCharCode(65 + i)}`);
    await host.send('I take them.', reply('Fenna has jobs.', names.map(name => `+ quest ${name} — a job | giver: Fenna | goal: Bring 3 Rope | reward: 5000 gold${rank}`)));
    for (const name of names) {
        const thread = host.sdk.query('director.thread', { key: name });
        if (!thread.taken) assert.equal((await host.sdk.command('quest.take', { key: name })).ok, true);
    }
    return { host, names };
}

test('fetch quests whose items the same reply minted pay no more than one reply may give', async t => {
    const { host, names } = await fetchQuests(t, 6);
    const top = host.sdk.query('quest.ranks')[0].reward[1];
    const before = wallet(host);
    await host.send('Here is the rope.', reply('You find rope and hand it over.', ['+ item Rope | qty: 18', ...names.map(name => `- quest ${name} — turned in`)]));
    const paid = wallet(host) - before;
    assert.ok(paid <= top, `one reply minting 18 Rope and turning in 6 fetch quests paid ${paid} (one reply may give ${top})`);
});

test('a fetch quest of story-minted items is held like a story-vouched errand (party rank, story budget)', async t => {
    const { host, names } = await fetchQuests(t, 1, ' | rank: S');
    const top = host.sdk.query('quest.ranks')[0].reward[1];
    const before = wallet(host);
    await host.send('Here is the rope.', reply('You find rope and hand it over.', ['+ item Rope | qty: 3', `- quest ${names[0]} — turned in`, `+ coin ${top}`]));
    const paid = wallet(host) - before;
    assert.ok(paid <= top, `minting 3 Rope, turning in one "rank: S" fetch quest and "+ coin ${top}" in one reply paid ${paid} (one reply may give ${top})`);
});
