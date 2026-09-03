import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    SHARED_BLOCKER_FAILSAFE_MS,
    setSharedQuietGenerationBlocked,
    sharedQuietGenerationStatus,
} from '../src/shared-generation-queue.js';

const meguminSource = readFileSync(new URL('../src/megumin.js', import.meta.url), 'utf8');

test('Inventory publishes and releases its shared hidden-generation blocker', () => {
    setSharedQuietGenerationBlocked('inventory-block', true);
    assert.deepEqual(sharedQuietGenerationStatus().blockers, ['inventory-block']);
    setSharedQuietGenerationBlocked('inventory-block', true);
    assert.deepEqual(sharedQuietGenerationStatus().blockers, ['inventory-block'], 'duplicate block calls stay idempotent');
    setSharedQuietGenerationBlocked('inventory-block', false);
    assert.deepEqual(sharedQuietGenerationStatus().blockers, []);
});

test('shared blocker has a failsafe beyond the normal ten-minute session lifetime', () => {
    assert.ok(SHARED_BLOCKER_FAILSAFE_MS > 10 * 60 * 1000);
    assert.ok(SHARED_BLOCKER_FAILSAFE_MS <= 15 * 60 * 1000);
});

test('Inventory session suspension drives the shared blocker', () => {
    assert.match(meguminSource, /setSharedQuietGenerationBlocked\('inventory-block', next\)/);
    assert.match(meguminSource, /export function setInventoryMountSuspended/);
});
