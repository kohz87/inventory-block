// Breaker a2 (v2 break pass 2): quest-sized fights bring "about a third of the goal or more … what is
// still missing at most, QUEST_MAX_FOES (24)" (combat/quest.js:73-104) — but the size is worked out per
// ROW. Every row whose name the quest's noun names is sized on its own: a kill quest "kill 30 Rat" with
// `! encounter Cellar Rat, Sewer Rat, Giant Rat, Plague Rat, Bog Rat, Dire Rat` brings 6 × 10 = 60 rats (30
// missing); "kill 1000 Rat" brings 6 × 24 = 144. The trivial fight is then lost by a level-1 fighter.
// Drop into rpg_battle/tests/v2/break/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { suiteHost } from './helpers/suite.js';
import { QUEST_MAX_FOES } from '../../../src/v2/combat/quest.js';

async function offered(t, goal) {
    const host = await suiteHost({ pack: false, seed: 10 });
    t.after(() => host.close());
    assert.equal((await host.cmd('party.create', { name: 'Wessel', preset: 'fighter' })).ok, true);
    await host.send('In.', host.reply('Town.', ['~ place Bluewatch Village | kind: settlement', `+ quest Rat Cull — clear the rats | goal: kill ${goal} Rat | reward: 40 gold | giver: Fenna`]));
    await host.send('Go.', host.reply('Rats everywhere.', ['! encounter Cellar Rat, Sewer Rat, Giant Rat, Plague Rat, Bog Rat, Dire Rat | tier: trivial']));
    const offer = host.q('combat.offers').at(-1);
    return offer.foes.reduce((sum, foe) => sum + foe.count, 0);
}

test('a2-quest-rows: a quest-sized fight brings no more than what the quest is missing', async t => {
    t.mock.method(console, 'warn', () => {});
    const total = await offered(t, 30);
    assert.ok(total <= 30, `kill 30 Rat (30 missing): ${total} rats offered`);
});

test('a2-quest-rows: a quest-sized fight brings at most QUEST_MAX_FOES in all', async t => {
    t.mock.method(console, 'warn', () => {});
    const total = await offered(t, 1000);
    assert.ok(total <= QUEST_MAX_FOES, `kill 1000 Rat: ${total} rats offered (QUEST_MAX_FOES ${QUEST_MAX_FOES})`);
});
