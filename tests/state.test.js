import test from 'node:test';
import assert from 'node:assert/strict';
import {
    attachMessageRevision,
    commitManualState,
    createRevision,
    ensureRoot,
    getCurrentInventory,
    normalizeQuantity,
    rememberBranchHead,
    resolveActiveRevision,
    validateAndNormalizeInventory,
} from '../src/state.js';
import { META_KEY, SOURCE } from '../src/constants.js';

function ctx(chat = []) {
    return { chat, chatMetadata: {} };
}

function item(name, quantity = '1', remark = '') {
    return { name, quantity, remark };
}

function inv(categories) {
    return { categories };
}

test('strict validation rejects blank and duplicate names', () => {
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: '', items: [] }])), /blank name/);
    assert.throws(() => validateAndNormalizeInventory(inv([
        { name: 'Supplies', items: [] }, { name: 'supplies', items: [] },
    ])), /Duplicate category/);
    assert.throws(() => validateAndNormalizeInventory(inv([
        { name: 'General', items: [item('Food'), item('food')] },
    ])), /Duplicate item/);
});

test('General and Uncategorized canonicalize to one root and x quantities normalize', () => {
    const state = validateAndNormalizeInventory(inv([
        { name: 'Uncategorized', items: [item('Gold', '×1', '100 Gold')] },
        { name: 'General', items: [item('Food', 'x1 set', '8 days')] },
    ]));
    assert.equal(state.categories.length, 1);
    assert.equal(state.categories[0].name, 'General');
    assert.deepEqual(state.categories[0].items.map(x => x.quantity), ['1', '1 set']);
    assert.equal(normalizeQuantity('X12'), '12');
});

test('unsupported state version never resets stored data', () => {
    const context = ctx();
    context.chatMetadata[META_KEY] = { version: 999, sentinel: true };
    assert.throws(() => ensureRoot(context), /Unsupported/);
    assert.equal(context.chatMetadata[META_KEY].sentinel, true);
});

test('manual branch head survives later user messages that extend the same lineage', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true });
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
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true });
    rememberBranchHead(context, r1);

    context.chat.push({ is_user: true, is_system: false, mes: 'buy', extra: {} });
    rememberBranchHead(context, r1);

    context.chat.push({ is_user: false, is_system: false, mes: 'B', extra: {} });
    const r2 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '80')] }]), { parent: r1, source: SOURCE.LLM });
    attachMessageRevision(context, 2, { baseRevision: r1, revision: r2, newUid: true });
    rememberBranchHead(context, r2);

    context.chat.push({ is_user: false, is_system: false, mes: 'C', extra: {} });
    const r3 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '80'), item('Potion')] }]), { parent: r2, source: SOURCE.LLM });
    attachMessageRevision(context, 3, { baseRevision: r2, revision: r3, newUid: true });
    rememberBranchHead(context, r3);

    context.chat.splice(2, 1);
    assert.equal(resolveActiveRevision(context), r1);
    assert.equal(getCurrentInventory(context).categories[0].items[0].remark, '100');
});

test('deleting a user message also invalidates assistant checkpoints generated after it', () => {
    const context = ctx();
    ensureRoot(context);
    context.chat.push({ is_user: false, is_system: false, mes: 'A', extra: {} });
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Food', '2')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true });
    rememberBranchHead(context, r1);
    context.chat.push({ is_user: true, is_system: false, mes: 'eat one', extra: {} });
    rememberBranchHead(context, r1);
    context.chat.push({ is_user: false, is_system: false, mes: 'B', extra: {} });
    const r2 = createRevision(context, inv([{ name: 'General', items: [item('Food', '1')] }]), { parent: r1, source: SOURCE.LLM });
    attachMessageRevision(context, 2, { baseRevision: r1, revision: r2, newUid: true });
    rememberBranchHead(context, r2);

    context.chat.splice(1, 1);
    assert.equal(resolveActiveRevision(context), r1);
});

test('message revision supports continuation descendant revisions', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Arrow', '10')] }]), { parent: 0, source: SOURCE.LLM });
    const r2 = createRevision(context, inv([{ name: 'General', items: [item('Arrow', '9')] }]), { parent: r1, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r2, newUid: true });
    rememberBranchHead(context, r2);
    delete context.chatMetadata[META_KEY].branchHeads[Object.keys(context.chatMetadata[META_KEY].branchHeads)[0]];
    assert.equal(resolveActiveRevision(context), r2);
});

test('swipe_info is created when swipes exist but swipe_info is absent', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', swipes: ['A'], swipe_id: 0, extra: {} }]);
    ensureRoot(context);
    attachMessageRevision(context, 0, { baseRevision: 0, revision: 0, newUid: true });
    assert.ok(Array.isArray(context.chat[0].swipe_info));
    assert.equal(context.chat[0].swipe_info.length, 1);
    assert.ok(context.chat[0].swipe_info[0].extra.inventoryBlockV2);
});

test('swipe changes restore the revision for that active swipe, including manual branch heads', () => {
    const message = { is_user: false, is_system: false, mes: 'Swipe A', swipes: ['Swipe A', 'Swipe B'], swipe_info: [{}, {}], swipe_id: 0, extra: {} };
    const context = ctx([message]);
    ensureRoot(context);

    const rA = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: rA, newUid: true });
    rememberBranchHead(context, rA);

    message.swipe_id = 1;
    message.mes = 'Swipe B';
    message.extra = {};
    const rB = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '80')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: rB, newUid: true });
    rememberBranchHead(context, rB);

    const rBManual = commitManualState(context, inv([{ name: 'General', items: [item('Gold', '1', '85')] }]), { source: SOURCE.MANUAL });

    message.swipe_id = 0;
    message.mes = message.swipes[0];
    message.extra = structuredClone(message.swipe_info[0].extra);
    assert.equal(resolveActiveRevision(context), rA);

    message.swipe_id = 1;
    message.mes = message.swipes[1];
    message.extra = structuredClone(message.swipe_info[1].extra);
    assert.equal(resolveActiveRevision(context), rBManual);
});

test('mutation serial changes only for real inventory revisions, not branch resolution', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    const root = ensureRoot(context);
    assert.equal(root.mutationSerial, 0);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    assert.equal(root.mutationSerial, 1);
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true });
    rememberBranchHead(context, r1);
    resolveActiveRevision(context);
    resolveActiveRevision(context);
    assert.equal(root.mutationSerial, 1);
    commitManualState(context, inv([{ name: 'General', items: [item('Gold', '1', '101')] }]), { source: SOURCE.MANUAL });
    assert.equal(root.mutationSerial, 2);
});
