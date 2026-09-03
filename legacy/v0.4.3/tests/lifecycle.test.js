import test from 'node:test';
import assert from 'node:assert/strict';
import {
 isBroadInventoryAdministration, isBackgroundGeneration, generationGuardLength,
 generationTypeMatches, userInstructionForGeneration,
} from '../src/lifecycle.js';

test('full replace requires bracketed admin intent', () => {
  assert.equal(isBroadInventoryAdministration('[OOC: create category for each party member]'), true);
  assert.equal(isBroadInventoryAdministration('[Compact all food related items into 1 food item and remark the quantity in duration]'), true);
  assert.equal(isBroadInventoryAdministration('I move the food to storage.'), false);
  assert.equal(isBroadInventoryAdministration('I move toward the storage room.'), false);
  assert.equal(isBroadInventoryAdministration('I organize the supplies before we leave.'), false);
});

test('background and aliases remain stable', () => {
  assert.equal(isBackgroundGeneration('quiet'), true);
  assert.equal(isBackgroundGeneration('impersonate'), true);
  assert.equal(generationTypeMatches('continue','appendFinal'), true);
  assert.equal(generationTypeMatches('regenerate','normal'), true);
});

test('normal guard can be rebound to post-send timeline length', () => {
  assert.equal(generationGuardLength('normal', 8, null), 8);
  assert.equal(generationGuardLength('normal', 9, null), 9);
  assert.equal(generationGuardLength('regenerate', 9, 8), 8);
});

test('composer is used only for normal/group instruction', () => {
  const chat=[{is_user:true,mes:'old'}];
  assert.equal(userInstructionForGeneration('normal',chat,'[OOC: organize inventory]'),'[OOC: organize inventory]');
  assert.equal(userInstructionForGeneration('swipe',chat,'ignored'),'old');
  assert.equal(userInstructionForGeneration('continue',chat,'ignored'),'');
  assert.equal(userInstructionForGeneration('appendFinal',chat,'ignored'),'');
});

test('bracketed narrative prose does not grant replace capability', () => {
  assert.equal(isBroadInventoryAdministration('[He moves the food to storage.]'), false);
  assert.equal(isBroadInventoryAdministration('[I organize the supplies before we leave.]'), false);
  assert.equal(isBroadInventoryAdministration('[Inventory: consolidate duplicate supplies]'), true);
  assert.equal(isBroadInventoryAdministration('[Move items into party categories]'), true);
});
