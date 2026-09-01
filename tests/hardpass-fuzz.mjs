import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
    consumeInventorySeed,
    consumeInventoryUpdates,
    formatInventorySeedBlock,
    formatInventoryState,
} from '../src/protocol.js';
import {
    attachMessageRevision,
    createRevision,
    ensureRoot,
    getCurrentInventory,
    rememberBranchHead,
} from '../src/state.js';
import { SOURCE } from '../src/constants.js';
import { createPromptSlotMarker, insertPromptSlot, replacePromptSlot } from '../src/injection.js';

function rnd(max) { return Math.floor(Math.random() * max); }
function randomText() {
    const atoms = ['alpha', 'beta', '|', '\\', ']', '<', '>', '</Inventory>', '-->', '{{user}}', '\\u003C', 'Name', '-- Sword --'];
    return Array.from({ length: 1 + rnd(6) }, () => atoms[rnd(atoms.length)]).join(` ${rnd(2) ? '' : ' '}`).trim();
}
function stateFor(i = 0) {
    return {
        categories: [
            {
                name: `C${i}] ${randomText()}`,
                items: Array.from({ length: 1 + rnd(5) }, (_, j) => ({
                    name: `I${j} ${randomText()}`,
                    quantity: String(1 + rnd(20)),
                    remark: randomText(),
                })),
            },
        ],
    };
}

for (let i = 0; i < 2000; i++) {
    const state = stateFor(i);
    const block = formatInventorySeedBlock(state);
    const parsed = consumeInventorySeed(block);
    assert.deepEqual(parsed.errors, []);
    assert.deepEqual(parsed.state, state);
}
console.log('seed fuzz: 2000 round-trips passed');

for (let i = 0; i < 1000; i++) {
    const remark = `${randomText()} --> ${randomText()}`;
    const payload = { mode: 'patch', ops: [{ op: 'add_item', category: 'General', name: `Loot ${i}`, quantity: 1, remark }] };
    const source = `Story ${i}. <!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify(payload)} -->.`;
    const result = consumeInventoryUpdates(source, { categories: [] });
    assert.deepEqual(result.errors, []);
    assert.equal(result.cleanedText, `Story ${i}.`);
    assert.equal(result.state.categories[0].items[0].remark, remark);
}
console.log('control fuzz: 1000 embedded terminators passed');

for (let i = 0; i < 500; i++) {
    const formatted = formatInventoryState(stateFor(i));
    assert.equal(formatted.includes('</InventoryState>'), false);
    assert.equal(formatted.includes('{{user}}'), false);
}
console.log('prompt escaping fuzz: 500 cases passed');


for (let i = 0; i < 1000; i++) {
    const prompt = `<InventoryState>\n${randomText()} ${i}\n</InventoryState>`;
    const slot = createPromptSlotMarker(prompt);
    assert.equal(slot.includes(prompt), false);
    const localChat = [
        { is_user: false, is_system: false, mes: 'previous' },
        { is_user: true, is_system: false, mes: `request ${i}` },
    ];
    insertPromptSlot(localChat, slot);
    assert.equal(localChat.at(-1).mes, `request ${i}`);
    const eventData = i % 2
        ? { prompt: `prefix ${slot} suffix`, dryRun: false }
        : { chat: [{ role: 'system', content: slot }, { role: 'user', content: 'request' }], dryRun: false };
    assert.equal(replacePromptSlot(eventData, slot, prompt), 1);
    assert.equal(JSON.stringify(eventData).includes(slot), false);
    if (typeof eventData.prompt === 'string') assert.equal(eventData.prompt.includes(prompt), true);
    else assert.equal(eventData.chat[0].content, prompt);
}
console.log('prompt-slot isolation fuzz: 1000 generation-local replacements passed');

function ctx(chat = []) { return { chat, chatMetadata: {} }; }
const original = ctx();
ensureRoot(original);
let parent = 0;
const messageCount = 4000;
for (let i = 0; i < messageCount; i++) {
    if (i % 2 === 0) {
        original.chat.push({ is_user: true, is_system: false, mes: `u${i}`, extra: {} });
        continue;
    }
    original.chat.push({ is_user: false, is_system: false, mes: `a${i}`, extra: {} });
    if (i % 40 === 1) {
        const revision = createRevision(original, {
            categories: [{ name: 'General', items: [{ name: 'Counter', quantity: '1', remark: String(i) }] }],
        }, { parent, source: SOURCE.LLM });
        attachMessageRevision(original, i, { baseRevision: parent, revision, newUid: true, portable: true });
        rememberBranchHead(original, revision);
        parent = revision;
    }
}
rememberBranchHead(original, parent);
const branched = ctx(structuredClone(original.chat));
const start = performance.now();
ensureRoot(branched);
const elapsed = performance.now() - start;
assert.equal(getCurrentInventory(branched).categories[0].items[0].remark, String(3961));
assert.ok(elapsed < 1200, `metadata-less hydration took ${elapsed.toFixed(1)} ms`);
console.log(`long-branch hydration: ${elapsed.toFixed(1)} ms for ${messageCount} messages`);
