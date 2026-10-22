// B-c1-1 (live beta cell 1): a condition a fight leaves with 1 round to go is written to the party as
// stacks 1, and the next fight reads stacks 1 as "a story's condition" and gives it the usual 3 rounds:
// the bleed grows from 1 round to 3 between fights (and in between it never wears off with story time).
// Drop into rpg_battle/tests/v2/break/. Run: node --test tests/v2/break/c1-fight-left-condition-grows.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyResult as applyResultV1 } from '../../../src/sheet.js';
import { fromSheet, toSheet } from '../../../src/v2/party/sheets.js';
import { partyCombatants } from '../../../src/v2/combat/setup.js';
import { actor } from '../combat/helpers/fake-ctx.js';

const ctxFor = actors => ({
    query: name => (name === 'party.actors' ? structuredClone(actors) : undefined),
    read: () => null,
});

test('a bleed a fight leaves with 1 round left starts the next fight with 1 round, not 3', () => {
    const pc = actor(1);
    // combat.end → party.applyResult: the fight left "bleed" with 1 round to go on the character.
    const result = { outcome: 'victory', party: [{ memberId: pc.id, hp: { cur: 60, max: 80 }, mp: { cur: 30, max: 30 }, down: false, conditions: [{ name: 'bleed', rounds: 1 }] }], xp: {}, uses: {} };
    const applied = applyResultV1(toSheet(pc), pc.id, result);
    const after = fromSheet(pc, applied.sheet);
    const kept = after.conditions.find(entry => /bleed/i.test(entry.kind));
    assert.ok(kept, 'the fight-left bleed is kept on the party');

    // The next fight (any time later): the party's conditions become the fight's.
    const [combatant] = partyCombatants(ctxFor([after]));
    const bleed = combatant.conditions.find(entry => entry.name === 'bleed');
    assert.ok(bleed, 'the bleed carries into the next fight');
    assert.equal(bleed.rounds, 1, `the bleed had 1 round left; the next fight gives it ${bleed.rounds}`);
});

