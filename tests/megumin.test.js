import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryMeguminHost, inventoryMountMatchesHost } from '../src/megumin.js';

function makeCard({ tabs = true, panel = true, inventoryTab = false, inventoryPane = false } = {}) {
  return {
    querySelector(selector) {
      if (selector === '.meg-blocks-tabs') return tabs ? {} : null;
      if (selector === '.meg-blocks-panel') return panel ? {} : null;
      if (selector === '.inventory-block-tab') return inventoryTab ? {} : null;
      if (selector === '.inventory-block-pane') return inventoryPane ? {} : null;
      return null;
    },
  };
}

function makeMessage({ card = null, standalone = false } = {}) {
  return {
    querySelector(selector) {
      if (selector === '.meg-blocks') return card;
      if (selector === '.inventory-block-card') return standalone ? {} : null;
      return null;
    },
  };
}

test('partial Megumin card is not treated as an attachment host', () => {
  assert.equal(inventoryMeguminHost(makeMessage({ card: makeCard({ panel: false }) })), null);
});

test('standalone mount is valid only while no complete Megumin host exists', () => {
  const beforeMegumin = makeMessage({ standalone: true });
  assert.equal(inventoryMountMatchesHost(beforeMegumin), true);

  const afterMegumin = makeMessage({
    standalone: true,
    card: makeCard({ inventoryTab: false, inventoryPane: false }),
  });
  assert.equal(inventoryMountMatchesHost(afterMegumin), false);
});

test('mount is stable once Inventory tab and pane live inside Megumin', () => {
  const message = makeMessage({
    standalone: false,
    card: makeCard({ inventoryTab: true, inventoryPane: true }),
  });
  assert.equal(inventoryMountMatchesHost(message), true);
});
