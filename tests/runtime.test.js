// Drives the real index.js event flow against a minimal fake SillyTavern + DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatInventoryBlock, formatInventoryTransport } from '../src/snapshot.js';

class FakeElement {
    constructor(tag = 'div') {
        this.tagName = tag;
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.value = '';
        this.innerHTML = '';
        this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
        this.stubs = new Map();
    }
    querySelector(selector) {
        if (!this.stubs.has(selector)) this.stubs.set(selector, new FakeElement());
        return this.stubs.get(selector);
    }
    querySelectorAll() { return []; }
    addEventListener() {}
    appendChild(child) { this.children.push(child); return child; }
    remove() {}
}

const rendered = new Set();
const fixed = {
    '#extensionsMenu': new FakeElement(),
    '#extensions_settings': new FakeElement(),
    '#chat': new FakeElement(),
};
globalThis.document = {
    body: { dataset: {} },
    createElement: tag => new FakeElement(tag),
    getElementById: () => null,
    querySelector(selector) {
        if (selector in fixed) return fixed[selector];
        const mes = /mesid="(\d+)"/.exec(selector);
        if (mes && rendered.has(Number(mes[1]))) return new FakeElement();
        return null;
    },
    querySelectorAll: () => [],
};
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.getComputedStyle = () => ({ display: 'none' });

const handlers = {};
const emitted = [];
const eventTypes = Object.fromEntries([
    'GENERATION_AFTER_COMMANDS', 'CHAT_COMPLETION_PROMPT_READY', 'GENERATE_AFTER_COMBINE_PROMPTS', 'MESSAGE_RECEIVED',
    'GENERATION_ENDED', 'GENERATION_STOPPED', 'MESSAGE_EDITED', 'MESSAGE_SWIPED', 'MESSAGE_DELETED', 'MESSAGE_UPDATED',
    'CHAT_CHANGED', 'CHARACTER_MESSAGE_RENDERED',
].map(name => [name, name.toLowerCase()]));

const block = gold => formatInventoryTransport({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: `${gold} Gold` }] }] });
const extensionPrompts = {};
const ctx = {
    chat: [],
    mainApi: 'openai',
    extensionSettings: {},
    getCurrentChatId: () => 'chat-1',
    saveSettingsDebounced() {},
    async saveChat() {},
    updateMessageBlock(id) { emitted.push(['updateMessageBlock', id]); },
    setExtensionPrompt(key, value) { extensionPrompts[key] = value; },
    eventTypes,
    eventSource: {
        on(type, fn) { (handlers[type] ??= []).push(fn); },
        async emit(type, ...args) {
            emitted.push([type, ...args]);
            for (const fn of handlers[type] ?? []) await fn(...args);
        },
    },
};
globalThis.SillyTavern = { getContext: () => ctx };

await import('../index.js');
const emit = (type, ...args) => ctx.eventSource.emit(eventTypes[type], ...args);
const finish = async () => {
    // Clears the pending session (and its watchdog timer) the way a received reply does.
    ctx.chat.push({ is_user: false, is_system: false, mes: 'reply' });
    await emit('MESSAGE_RECEIVED', ctx.chat.length - 1);
};

test('chat completion: foreground prompt gets exactly one current snapshot', async () => {
    ctx.chat = [{ is_user: false, mes: `Hi.\n${block(100)}` }, { is_user: true, mes: 'buy' }, { is_user: false, mes: `Bought.\n${block(90)}` }];
    await emit('GENERATION_AFTER_COMMANDS', 'normal', {}, false);
    const event = { chat: ctx.chat.map(m => ({ role: m.is_user ? 'user' : 'assistant', content: m.mes })), dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', event);
    const text = JSON.stringify(event.chat);
    assert.match(text, /90 Gold/);
    assert.doesNotMatch(text, /100 Gold/);
    assert.equal((text.match(/<Inventory>/g) ?? []).length, 1);
    await finish();
});

test('regenerate after a failed reply keeps the newest snapshot as baseline', async () => {
    ctx.chat = [{ is_user: false, mes: block(100) }, { is_user: true, mes: 'buy' }, { is_user: false, mes: block(90) }, { is_user: true, mes: 'go on' }];
    await emit('GENERATION_AFTER_COMMANDS', 'regenerate', {}, false);
    const event = { chat: [{ role: 'system', content: 'rules' }], dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', event);
    assert.match(JSON.stringify(event.chat), /90 Gold/);
    await finish();
});

test('regenerate of an assistant reply uses the snapshot before it', async () => {
    ctx.chat = [{ is_user: false, mes: block(100) }, { is_user: true, mes: 'buy' }, { is_user: false, mes: block(90) }];
    await emit('GENERATION_AFTER_COMMANDS', 'regenerate', {}, false);
    const event = { chat: [{ role: 'system', content: 'rules' }], dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', event);
    assert.match(JSON.stringify(event.chat), /100 Gold/);
    await finish();
});

test('text completion: context arrives through the extension prompt and is not duplicated', async () => {
    ctx.mainApi = 'textgenerationwebui';
    ctx.chat = [{ is_user: false, mes: `Old.\n${block(100)}` }, { is_user: true, mes: 'buy' }, { is_user: false, mes: `New.\n${block(90)}` }];
    await emit('GENERATION_AFTER_COMMANDS', 'normal', {}, false);
    const context = extensionPrompts.inventory_block;
    assert.match(context, /INVENTORY_BLOCK_V05_CONTEXT_BEGIN[\s\S]*90 Gold/);
    const event = { prompt: `<|im_start|>system\nStory.\n${context}<|im_end|>\nOld.\n${block(100)}\nNew.\n${block(90)}`, dryRun: false };
    await emit('GENERATE_AFTER_COMBINE_PROMPTS', event);
    assert.ok(event.prompt.startsWith('<|im_start|>system'), 'instruct template stays first');
    assert.equal((event.prompt.match(/INVENTORY_BLOCK_V05_CONTEXT_BEGIN/g) ?? []).length, 1);
    assert.doesNotMatch(event.prompt, /100 Gold/);
    assert.equal((event.prompt.match(/<Inventory>/g) ?? []).length, 1, 'only the context snapshot remains');
    await finish();
    assert.equal(extensionPrompts.inventory_block, '', 'extension prompt cleared after the reply');
    ctx.mainApi = 'openai';
});

test('background prompts keep only the newest historical snapshot', async () => {
    ctx.chat = [{ is_user: false, mes: block(100) }, { is_user: false, mes: block(90) }];
    const event = { chat: [
        { role: 'assistant', content: `a\n${block(100)}` },
        { role: 'assistant', content: `b\n${block(95)}` },
        { role: 'assistant', content: `c\n${block(90)}` },
    ], dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', event);
    const text = JSON.stringify(event.chat);
    assert.match(text, /90 Gold/);
    assert.doesNotMatch(text, /100 Gold|95 Gold/);
    assert.doesNotMatch(text, /CONTEXT_BEGIN/, 'no generation instructions for background prompts');
});

test('normalizing a rendered message lets other extensions re-render via MESSAGE_UPDATED', async () => {
    ctx.chat = [{ is_user: false, is_system: false, mes: `Story.\n${formatInventoryBlock({ categories: [{ name: 'General', items: [{ name: 'Rope', quantity: '1', remark: '' }] }] })}` }];
    rendered.add(0);
    emitted.length = 0;
    await emit('MESSAGE_RECEIVED', 0);
    const names = emitted.map(entry => entry[0]);
    assert.ok(names.indexOf('updateMessageBlock') >= 0);
    assert.ok(names.indexOf(eventTypes.MESSAGE_UPDATED) > names.indexOf('updateMessageBlock'));
    assert.match(ctx.chat[0].mes, /<!-- INVENTORY_BLOCK_V05/);
    rendered.clear();
});
