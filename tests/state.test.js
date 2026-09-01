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
    revisionCount,
    validateAndNormalizeInventory,
} from '../src/state.js';
import { EXTRA_KEY, LIMITS, META_KEY, SOURCE } from '../src/constants.js';

function ctx(chat = []) { return { chat, chatMetadata: {} }; }
function item(name, quantity = '1', remark = '') { return { name, quantity, remark }; }
function inv(categories) { return { categories }; }

test('strict validation rejects malformed and non-positive values', () => {
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: '', items: [] }])), /blank name/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items: [item('Food'), item('food')] }])), /Duplicate item/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items: [{ name: 'Food', quantity: { bad: 1 }, remark: '' }] }])), /must be text or a number/);
    assert.throws(() => validateAndNormalizeInventory(inv([{ name: 'General', items: [item('Food', '0')] }])), /greater than zero/);
    assert.equal(normalizeQuantity('X12'), '12');
    assert.equal(normalizeQuantity('X-grade'), 'X-grade');
});

test('unsupported state version never resets stored data', () => {
    const context = ctx();
    context.chatMetadata[META_KEY] = { version: 999, sentinel: true };
    assert.throws(() => ensureRoot(context), /Unsupported/);
    assert.equal(context.chatMetadata[META_KEY].sentinel, true);
});

test('assistant prose edits do not invalidate an ordinary message revision', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'Original prose', extra: {} }]);
    ensureRoot(context);
    const r1 = createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', '100')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    rememberBranchHead(context, r1);
    context.chat[0].mes = 'Corrected prose';
    assert.equal(resolveActiveRevision(context), r1);
});

test('manual checkpoint on an unprocessed assistant gains a stable uid and survives prose edits in a metadata-less branch', () => {
    const original = ctx([{ is_user: false, is_system: false, mes: 'Greeting', extra: {} }]);
    ensureRoot(original);
    const r1 = commitManualState(original, inv([{ name: 'General', items: [item('Gold', '1', '150')] }]), { source: SOURCE.MANUAL });
    assert.ok(original.chat[0].extra[EXTRA_KEY].uid);
    assert.equal(original.chat[0].extra[EXTRA_KEY].checkpoint.revision, r1);
    original.chat[0].mes = 'Greeting, corrected punctuation.';

    const branched = ctx(structuredClone(original.chat));
    ensureRoot(branched);
    assert.equal(getCurrentInventory(branched).categories[0].items[0].remark, '150');
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

test('portable assistant checkpoint rebuilds inventory when chat metadata is missing', () => {
    const original = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    ensureRoot(original);
    const r1 = createRevision(original, inv([{ name: 'General', items: [item('Knife')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(original, 0, { baseRevision: 0, revision: r1, newUid: true, portable: true });
    const branched = ctx(structuredClone(original.chat));
    ensureRoot(branched);
    assert.equal(getCurrentInventory(branched).categories[0].items[0].name, 'Knife');
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
    context.chat.splice(2, 1);
    assert.equal(resolveActiveRevision(context), r1);
});

test('revision storage is hard-capped while the active state remains available', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    ensureRoot(context);
    for (let i = 0; i < LIMITS.revisions + 120; i++) {
        commitManualState(context, inv([{ name: 'General', items: [item('Counter', '1', String(i + 1))] }]), { source: SOURCE.MANUAL });
    }
    assert.ok(revisionCount(context) <= LIMITS.revisions);
    assert.equal(getCurrentInventory(context).categories[0].items[0].remark, String(LIMITS.revisions + 120));
});


test('damaged metadata with excessive branch heads is pruned before revision compaction', () => {
    const context = ctx();
    const root = ensureRoot(context);
    for (let i = 0; i < LIMITS.branchHeads + 300; i++) {
        root.branchHeads[`fake-${i}`] = {
            revision: 0,
            length: 0,
            sticky: i % 2 === 0,
            touchedAt: i,
            lineageVersion: 2,
        };
    }
    ensureRoot(context);
    assert.ok(Object.keys(root.branchHeads).length <= LIMITS.branchHeads);
    assert.ok(revisionCount(context) <= LIMITS.revisions);
});

test('a pruned old message revision is recovered from its portable checkpoint', () => {
    const context = ctx([{ is_user: false, is_system: false, mes: 'A', extra: {} }]);
    const root = ensureRoot(context);
    const old = createRevision(context, inv([{ name: 'General', items: [item('Old Sword')] }]), { parent: 0, source: SOURCE.LLM });
    attachMessageRevision(context, 0, { baseRevision: 0, revision: old, newUid: true, portable: true });

    for (let i = 0; i < LIMITS.revisions + 60; i++) {
        createRevision(context, inv([{ name: 'General', items: [item('Gold', '1', String(i))] }]), { source: SOURCE.MANUAL });
    }
    assert.equal(root.revisions[String(old)], undefined);

    root.branchHeads = {};
    root.activeRevision = 0;
    const resolved = resolveActiveRevision(context);
    assert.notEqual(resolved, 0);
    assert.equal(getCurrentInventory(context).categories[0].items[0].name, 'Old Sword');
});
