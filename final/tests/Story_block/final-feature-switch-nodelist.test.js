// Final soak (live, SillyTavern 1.19 / Chromium): flipping any Feature switch in the Story Suite settings
// throws "TypeError: root.querySelectorAll(...).find is not a function" (host-ui.js setFeature). A browser's
// querySelectorAll returns a NodeList, which has no .find; the testkit's fake DOM returns an array, so the
// existing tests pass. The choice is stored and the overlay redrawn before the throw, but the switch loses
// the focus it was meant to keep and every flip is an uncaught page error. Invariant 4.
// Drop into Story_block/tests/v2/break/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../../../testkit/index.js';
import { setupDom } from '../view/mounts/helpers.js';
import { renderSettingsHost } from '../../../src/v2/host-ui.js';

// What a browser hands back: indexable, iterable, forEach, but not an Array.
function asNodeList(array) {
    const list = Object.create({ item(i) { return this[i] ?? null; }, forEach(fn, self) { Array.prototype.forEach.call(this, fn, self); }, [Symbol.iterator]() { return Array.prototype[Symbol.iterator].call(this); } });
    array.forEach((node, i) => { list[i] = node; });
    Object.defineProperty(list, 'length', { value: array.length });
    return list;
}

test('final: a Feature switch flipped in a real browser DOM (NodeList) does not throw', async () => {
    const doc = setupDom();
    const host = await createHost();
    const root = doc.createElement('div');
    doc.body.appendChild(root);
    const realAll = root.querySelectorAll.bind(root);
    root.querySelectorAll = selector => asNodeList([...realAll(selector)]);
    renderSettingsHost(root, { registry: host.registry, settings: host.settings, features: host.features, doc, sdk: host.sdk });
    const input = [...realAll('.story-suite-feature')].find(row => row.dataset.feature === 'story-block.cards').querySelector('input');
    input.checked = false;
    assert.doesNotThrow(() => input.dispatch('change'));
    assert.equal(host.sdk.feature('story-block.cards'), false);
    host.close();
});
