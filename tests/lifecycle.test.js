import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isBackgroundGeneration,
    isBroadInventoryAdministration,
    isReplacementGeneration,
    isTrackedGeneration,
    latestUserMessageText,
    normalizeGenerationType,
    targetMessageForGeneration,
    userInstructionForGeneration,
} from '../src/lifecycle.js';

test('quiet and impersonate generations are ignored', () => {
    assert.equal(isBackgroundGeneration('quiet'), true);
    assert.equal(isBackgroundGeneration('normal'), false);
    assert.equal(isTrackedGeneration('quiet'), false);
    assert.equal(isTrackedGeneration('impersonate'), false);
    assert.equal(isTrackedGeneration('normal'), true);
    assert.equal(isTrackedGeneration('swipe'), true);
    assert.equal(isTrackedGeneration('normal', true), false);
});

test('normal generation has no existing target while replacement/continue do', () => {
    assert.equal(targetMessageForGeneration('normal', 12), null);
    assert.equal(targetMessageForGeneration('swipe', 12), 12);
    assert.equal(targetMessageForGeneration('regenerate', 12), 12);
    assert.equal(targetMessageForGeneration('continue', 12), 12);
    assert.equal(targetMessageForGeneration('append', 12), 12);
    assert.equal(targetMessageForGeneration('appendFinal', 12), 12);
    assert.equal(isReplacementGeneration('continue'), false);
    assert.equal(isReplacementGeneration('swipe'), true);
});

test('broad OOC inventory administration is recognized', () => {
    assert.equal(isBroadInventoryAdministration('[OOC: create category for each party member]'), true);
    assert.equal(isBroadInventoryAdministration('[Compact all food related items into 1 food item and remark the quantity in duration]'), true);
    assert.equal(isBroadInventoryAdministration('I eat one ration.'), false);
});

test('latest user message ignores assistant tail', () => {
    const chat = [{ is_user: true, mes: 'first' }, { is_user: false, mes: 'reply' }, { is_user: true, mes: 'latest' }, { is_user: false, mes: 'reply2' }];
    assert.equal(latestUserMessageText(chat), 'latest');
    assert.equal(normalizeGenerationType(' SWIPE '), 'swipe');
});


test('normal generation uses the composer text before SillyTavern appends the new user message', () => {
    const chat = [{ is_user: true, mes: 'old request' }, { is_user: false, mes: 'old reply' }];
    assert.equal(userInstructionForGeneration('normal', chat, '[OOC: consolidate my inventory]'), '[OOC: consolidate my inventory]');
    assert.equal(userInstructionForGeneration('swipe', chat, 'ignored composer'), 'old request');
    assert.equal(userInstructionForGeneration('normal', chat, ''), 'old request');
});
