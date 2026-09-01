import test from 'node:test';
import assert from 'node:assert/strict';
import {
    attachMessageRevision,
    attachPortableCheckpoint,
    commitManualState,
    createRevision,
    ensureRoot,
    getCurrentInventory,
    normalizeQuantity,
    rememberBranchHead,
    resolveActiveRevision,
    validateAndNormalizeInventory,
} from '../src/state.js';
import { EXTRA_KEY, LIMITS, META_KEY, SOURCE } from '../src/constants.js';

function ctx(chat = []) { return { chat, chatMetadata: {} }; }
function item(name, quantity = '1', remark = '') { return { name, quantity, remark }; }
function inv(categories) { return { categories }; }

test('strict validation rejects blank, duplicate, object and non-positive values', () => {
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: '', items: [] }])), /blank name/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'Supplies', items: [] }, { name: 'supplies', items: [] }])), /Duplicate category/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items: [item('Food'), item('food')] }])), /Duplicate item/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items: [{ name: 'Food', quantity: { bad: 1 }, remark: '' }] }])), /must be text or a number/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items: [item('Food', '0')] }])), /greater than zero/);
});

test('size limits reject oversized inventory', () => {
    const items = Array.from({ length: LIMITS.items + 1 }, (_, i) => item(`I${i}`));
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items }])), /too many items/);
});

test('General and Uncategorized canonicalize and only numeric x prefixes normalize', () => {
    const state = validateAndNormalizeInventory(inv([
        { name: 'Uncategorized', items: [item('Gold', '×1', '100 Gold')] },
        { name: 'General', items: [item('Food', 'x1 set', '8 days'), item('Size', 'XL', '')] },
    ]));
    assert.equal(state.categories.length, 1);
    assert.deepEqual(state.categories[0].items.map(x => x.quantity), ['1', '1 set', 'XL']);
    assert.equal(normalizeQuantity('X12'), '12');
    assert.equal(normalizeQuantity('X-grade'), 'X-grade');
});

test('unsupported state version never resets stored data', () => {
    const context = ctx();
    context.chatMetadata[META_KEY] = { version: 999, sentinel: true };
    assert.throws(() => ensureRoot(context), /Unsupported/);
    assert.equal(context.chatMetadata[META_KEY].sentinel, true);
});

test('manual checkpoint survives later user messages on same lineage', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    rememberBranchHead(context, r1);
    const r2 = commitManualState(context, inv([{ name: 'General', items: [item('Gold', '1', '125')] }]), { source: SOURCE.MANUAL });
    context.chat.push({ is_user: true, is_system: false, mes: 'continue', extra: {} });
    assert.equal(resolveActiveRevision(context), r2);
});

test('middle assistant deletion invalidates downstream inventory revisions', () => {
    const context = ctx();
    ensureRoot(context);
    context.chat.push({ is_user: false, is_system: false, mes: 'A', extra: {} });
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    rememberBranchHead(context, r1);
    context.chat.push({ is_user: true, is_system: false, mes: 'buy', extra: {} });
    context.chat.push({ is_user: false, is_system: false, mes: 'B', extra: {} });
    const r2 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '80')] }]), { parent: r1, source: SOURCE.LLM });
    attachMessageRevision(context, 2, { baseRevision: r1, revision: r2, newUid: true, portable: true });
    rememberBranchHead(context, r2);
    context.chat.push({ is_user: false, is_system: false, mes: 'C', extra: {} });
    const r3 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '80'), item('Potion')] }]), { parent: r2, source: SOURCE.LLM });
    attachMessageRevision(context, 3, { baseRevision: r2, revision: r3, newUid: true, portable: true });
    rememberBranchHead(context, r3);
    context.chat.splice(2, 1);
    assert.equal(resolveActiveRevision(context), r1);
});

test('assistant prose edits do not invalidate v2 lineage', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'Original prose', extra: {} }]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    rememberBranchHead(context, r1);
    context.chat[0].mes = 'Corrected prose';
    assert.equal(resolveActiveRevision(context), r1);
});

test('user prose edits still invalidate downstream inventory lineage', () => {
    const context = ctx([
        { is_user: true, is_system: false, mes: 'buy sword', extra: {} },
        { is_user: false, is_system: false, mes: 'done', extra: {} },
    ]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Sword')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 1, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    rememberBranchHead(context, r1);
    context.chat[0].mes = 'do not buy sword';
    assert.equal(resolveActiveRevision(context), 0);
});

test('portable assistant checkpoints rebuild inventory when chat metadata is missing', () => {
    const original = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    ensureRoot(original);
    const r1 = createRevision(original, inv([{ name: 'General', items: [item('Gold', '1', '100 Gold')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(original, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });

    const branched = ctx(structuredClone(original.chat));
    const root = ensureRoot(branched);
    assert.notEqual(root.activeRevision, 0);
    assert.equal(getCurrentInventory(branched).categories[0].items[0].remark, '100 Gold');
    assert.equal(branched.chat[0].extra[EXTRA_KEY].revision, root.activeRevision);
});

test('portable manual checkpoint on a user message rebuilds branch state', () => {
    const original = ctx([
        { is_user: false, is_system: false, mes: 'A', extra: {} },
        { is_user: true, is_system: false, mes: 'OOC edit', extra: {} },
    ]);
    ensureRoot(original);
    const r1 = createRevision(original, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(original, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    const r2 = commitManualState(original, inv([{ name: 'General', items: [item('Gold', '1', '150')] }]), { source: SOURCE.MANUAL });
    assert.equal(original.chat[1].extra[EXTRA_KEY].checkpoint.revision, r2);

    const branched = ctx(structuredClone(original.chat));
    ensureRoot(branched);
    assert.equal(getCurrentInventory(branched).categories[0].items[0].remark, '150');
});

test('swipe_info carries portable checkpoint metadata', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', swipes: ['A'], swipe_id: 0, extra: {} }]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Knife')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    assert.ok(context.chat[0].swipe_info[0].extra[EXTRA_KEY].checkpoint.state);
});

test('branch-head pruning is a hard cap even with sticky manual heads', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    const root = ensureRoot(context);
    for (let i = 0; i < LIMITS.branchHeads + 80; i++) {
        context.chat[0].mes = `A${i}`;
        const r = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', String(i + 1))] }]), { parent: root.activeRevision, source: SOURCE.MANUAL });
        attachPortableCheckpoint(context, 0, r, { source: SOURCE.MANUAL });
        rememberBranchHead(context, r);
    }
    assert.ok(Object.keys(root.branchHeads).length <= LIMITS.branchHeads);
});

test('alternate swipe in a metadata-less branch lazily materializes its portable checkpoint', () => {
    const message = { is_user: false, is_system: false, mes: 'A', swipes: ['A', 'B'], swipe_info: [{}, {}], swipe_id: 0, extra: {} };
    const original = ctx([message]);
    ensureRoot(original);
    const a = createRevision(original, inv([{ name: 'General', items: [item('Sword')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(original, 0, { baseRevision: 0, revision: a, newUid: true, portable: true });
    message.swipe_id = 1;
    message.mes = 'B';
    message.extra = {};
    const b = createRevision(original, inv([{ name: 'General', items: [item('Potion')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(original, 0, { baseRevision: 0, revision: b, newUid: true, portable: true });

    const selected = structuredClone(message);
    selected.swipe_id = 0;
    selected.mes = selected.swipes[0];
    selected.extra = structuredClone(selected.swipe_info[0].extra);
    const branched = ctx([selected]);
    ensureRoot(branched);
    assert.equal(getCurrentInventory(branched).categories[0].items[0].name, 'Sword');

    branched.chat[0].swipe_id = 1;
    branched.chat[0].mes = branched.chat[0].swipes[1];
    branched.chat[0].extra = structuredClone(branched.chat[0].swipe_info[1].extra);
    resolveActiveRevision(branched);
    assert.equal(getCurrentInventory(branched).categories[0].items[0].name, 'Potion');
    assert.ok(branched.chat[0].extra[EXTRA_KEY].revision >= 1);
});

test('new swipe metadata cannot inherit the rejected swipe portable checkpoint', () => {
    const message = { is_user: false, is_system: false, mes: 'A', swipes: ['A', 'B'], swipe_info: [{}, {}], swipe_id: 0, extra: {} };
    const context = ctx([message]);
    ensureRoot(context);
    const sword = createRevision(context, inv([{ name: 'General', items: [item('Sword')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: sword, newUid: true, portable: true });
    assert.ok(message.extra[EXTRA_KEY].checkpoint);

    // Simulate a host that starts the new swipe from the current extra object.
    message.swipe_id = 1;
    message.mes = 'B';
    attachMessageRevision(context, 0, { baseRevision: 0, revision: 0, newUid: true, portable: false });
    assert.equal(message.extra[EXTRA_KEY].checkpoint, undefined);
});

test('blindly copied active swipe metadata cannot leak inventory into a different swipe', () => {
    const message = {
        is_user: false,
        is_system: false,
        mes: 'Swipe A',
        swipes: ['Swipe A', 'Swipe B'],
        swipe_info: [{}, {}],
        swipe_id: 0,
        extra: {},
    };
    const context = ctx([message]);
    ensureRoot(context);
    const rA = createRevision(context, inv([{ name: 'General', items: [item('Sword', '1')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: rA, newUid: true, portable: true });
    rememberBranchHead(context, rA);

    // Model what SillyTavern's multi-swipe save path can do after MESSAGE_RECEIVED:
    // clone the active message.extra into an alternate candidate that was never processed.
    message.swipe_info[1].extra = structuredClone(message.extra);
    message.swipe_id = 1;
    message.mes = message.swipes[1];
    message.extra = structuredClone(message.swipe_info[1].extra);

    assert.equal(resolveActiveRevision(context), 0);
    assert.deepEqual(getCurrentInventory(context), { categories: [] });
});
