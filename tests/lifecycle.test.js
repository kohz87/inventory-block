import test from 'node:test';
import assert from 'node:assert/strict';
import {
    generationGuardLength,
    generationTypeMatches,
    isBackgroundGeneration,
    isBroadInventoryAdministration,
    isReplacementGeneration,
    isTrackedGeneration,
    latestUserMessageText,
    normalizeGenerationType,
    targetMessageForGeneration,
    userInstructionForGeneration,
} from '../src/lifecycle.js';

test('quiet and impersonate generations are untracked background work', () => {
    assert.equal(isBackgroundGeneration('quiet'), true);
    assert.equal(isBackgroundGeneration('impersonate'), true);
    assert.equal(isTrackedGeneration('quiet'), false);
    assert.equal(isTrackedGeneration('normal'), true);
    assert.equal(isTrackedGeneration('normal', true), false);
});

test('target and replacement generation classification is stable', () => {
    assert.equal(targetMessageForGeneration('normal', 12), null);
    assert.equal(targetMessageForGeneration('swipe', 12), 12);
    assert.equal(targetMessageForGeneration('regenerate', 12), 12);
    assert.equal(targetMessageForGeneration('continue', 12), 12);
    assert.equal(isReplacementGeneration('continue'), false);
    assert.equal(isReplacementGeneration('swipe'), true);
});

test('event type matching accepts SillyTavern continuation/regeneration aliases only', () => {
    assert.equal(generationTypeMatches('normal', 'normal'), true);
    assert.equal(generationTypeMatches('continue', 'appendFinal'), true);
    assert.equal(generationTypeMatches('continue', 'updated'), false);
    assert.equal(generationTypeMatches('regenerate', 'normal'), true);
    assert.equal(generationTypeMatches('swipe', 'normal'), false);
});

test('replacement timeline guards exclude the replaced message', () => {
    assert.equal(generationGuardLength('normal', 20, null), 20);
    assert.equal(generationGuardLength('continue', 20, 19), 20);
    assert.equal(generationGuardLength('regenerate', 20, 19), 19);
    assert.equal(generationGuardLength('swipe', 20, 19), 19);
});

test('broad OOC inventory administration is recognized', () => {
    assert.equal(isBroadInventoryAdministration('[OOC: create category for each party member]'), true);
    assert.equal(isBroadInventoryAdministration('[Compact all food related items into 1 food item and remark the quantity in duration]'), true);
    assert.equal(isBroadInventoryAdministration('I eat one ration.'), false);
});

test('composer text is used before SillyTavern appends the new user message', () => {
    const chat = [{ is_user: true, mes: 'old request' }, { is_user: false, mes: 'old reply' }];
    assert.equal(userInstructionForGeneration('normal', chat, '[OOC: consolidate my inventory]'), '[OOC: consolidate my inventory]');
    assert.equal(userInstructionForGeneration('swipe', chat, 'ignored composer'), 'old request');
    assert.equal(latestUserMessageText(chat), 'old request');
    assert.equal(normalizeGenerationType(' SWIPE '), 'swipe');
});
