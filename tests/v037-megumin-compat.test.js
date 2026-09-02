import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { inventoryMeguminHost, inventoryMountMatchesHost } from '../src/megumin.js';

const source = fs.readFileSync(new URL('../src/megumin.js', import.meta.url), 'utf8');

function makeCard({ ready = true, inventoryMounted = false } = {}) {
    return {
        querySelector(selector) {
            if (selector === '.meg-blocks-tabs') return ready ? {} : null;
            if (selector === '.meg-blocks-panel') return ready ? {} : null;
            if (selector === '.inventory-block-tab') return inventoryMounted ? {} : null;
            if (selector === '.inventory-block-pane') return inventoryMounted ? {} : null;
            return null;
        },
    };
}

function makeMessage({ megumin = null, standalone = false } = {}) {
    return {
        querySelector(selector) {
            if (selector === '.meg-blocks') return megumin;
            if (selector === '.inventory-block-card') return standalone ? {} : null;
            return null;
        },
    };
}

test('standalone Inventory mount is valid while no complete Megumin host exists', () => {
    const partial = makeCard({ ready: false });
    assert.equal(inventoryMeguminHost(makeMessage({ megumin: partial, standalone: true })), null);
    assert.equal(inventoryMountMatchesHost(makeMessage({ megumin: partial, standalone: true })), true);
});

test('standalone mount becomes stale as soon as a complete Megumin host appears', () => {
    const ready = makeCard({ ready: true, inventoryMounted: false });
    const message = makeMessage({ megumin: ready, standalone: true });
    assert.equal(inventoryMeguminHost(message), ready);
    assert.equal(inventoryMountMatchesHost(message), false);
});

test('Megumin-mounted Inventory satisfies the dedupe guard', () => {
    const ready = makeCard({ ready: true, inventoryMounted: true });
    assert.equal(inventoryMountMatchesHost(makeMessage({ megumin: ready, standalone: false })), true);
});

test('mountNow deduplicates only when the current host mode still matches', () => {
    assert.match(source, /mountedMessageElement === messageElement && inventoryMountMatchesHost\(messageElement\)/);
    assert.doesNotMatch(source, /mountedMessageElement === messageElement && hasExistingMount/);
});
