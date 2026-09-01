import test from 'node:test';
import assert from 'node:assert/strict';
import { createPromptSlotMarker, injectDryRunPrompt, insertPromptSlot, replacePromptSlot } from '../src/injection.js';

test('generation-local prompt slot preserves the final conversational message', () => {
    const chat = [
        { is_user: false, is_system: false, mes: 'greeting' },
        { is_user: true, is_system: false, mes: 'buy food' },
    ];
    const marker = createPromptSlotMarker('<InventoryState>secret sword</InventoryState>');
    assert.equal(marker.includes('secret sword'), false);
    assert.ok(marker.length > 40);
    assert.equal(insertPromptSlot(chat, marker), true);
    assert.equal(chat.length, 3);
    assert.equal(chat[1].is_system, false);
    assert.equal(chat[1].extra.type, 'narrator');
    assert.equal(chat[1].mes, marker);
    assert.equal(chat[2].mes, 'buy food');
});

test('prompt slot replacement works for text-completion prompt data', () => {
    const marker = createPromptSlotMarker();
    const data = { prompt: `System: ${marker}\nUser: continue` };
    assert.equal(replacePromptSlot(data, marker, '<InventoryState>safe</InventoryState>'), 1);
    assert.equal(data.prompt.includes(marker), false);
    assert.match(data.prompt, /<InventoryState>safe<\/InventoryState>/);
});

test('prompt slot replacement works recursively for chat-completion multimodal data', () => {
    const marker = createPromptSlotMarker();
    const data = {
        chat: [
            { role: 'system', content: [{ type: 'text', text: `prefix ${marker} suffix` }] },
            { role: 'user', content: 'hello' },
        ],
    };
    assert.equal(replacePromptSlot(data, marker, 'STATE'), 1);
    assert.equal(data.chat[0].content[0].text, 'prefix STATE suffix');
});

test('unrelated prompt events are untouched', () => {
    const marker = createPromptSlotMarker();
    const data = { chat: [{ role: 'user', content: 'background task' }] };
    const before = structuredClone(data);
    assert.equal(replacePromptSlot(data, marker, 'STATE'), 0);
    assert.deepEqual(data, before);
});


test('dry-run prompt accounting injects only into dry-run prompt-ready data', () => {
    const tc = { prompt: 'base', dryRun: true };
    assert.equal(injectDryRunPrompt(tc, 'INVENTORY'), true);
    assert.equal(tc.prompt, 'base\nINVENTORY');

    const cc = { chat: [{ role: 'user', content: 'base' }], dryRun: true };
    assert.equal(injectDryRunPrompt(cc, 'INVENTORY'), true);
    assert.deepEqual(cc.chat.at(-1), { role: 'system', content: 'INVENTORY' });

    const live = { prompt: 'base', dryRun: false };
    assert.equal(injectDryRunPrompt(live, 'INVENTORY'), false);
    assert.equal(live.prompt, 'base');
});
