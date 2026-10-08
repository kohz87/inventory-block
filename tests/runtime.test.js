// Drives the real index.js event flow against a minimal fake SillyTavern + DOM.
import test, { mock } from 'node:test';
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
        this.listeners = {};
    }
    querySelector(selector) {
        if (!this.stubs.has(selector)) this.stubs.set(selector, new FakeElement());
        return this.stubs.get(selector);
    }
    querySelectorAll() { return []; }
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
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
    'CHAT_CHANGED', 'CHARACTER_MESSAGE_RENDERED', 'MESSAGE_SWIPE_DELETED',
].map(name => [name, name.toLowerCase()]));

const block = gold => formatInventoryTransport({ categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: `${gold} Gold` }] }] });
const extensionPrompts = {};
const notices = [];
globalThis.toastr = Object.fromEntries(['success', 'info', 'warning', 'error'].map(level => [level, message => notices.push(`${level}: ${message}`)]));
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

const plainRope = () => `Story.\n${formatInventoryBlock({ categories: [{ name: 'General', items: [{ name: 'Rope', quantity: '1', remark: '' }] }] })}`;

test('a received reply is re-rendered once, without emitting MESSAGE_UPDATED', async () => {
    ctx.chat = [{ is_user: false, is_system: false, mes: plainRope() }];
    rendered.add(0);
    emitted.length = 0;
    await emit('MESSAGE_RECEIVED', 0);
    const names = emitted.map(entry => entry[0]);
    assert.equal(names.filter(name => name === 'updateMessageBlock').length, 1);
    assert.ok(!names.includes(eventTypes.MESSAGE_UPDATED), 'Translate and Summarize react to MESSAGE_UPDATED');
    assert.match(ctx.chat[0].mes, /<!-- INVENTORY_BLOCK_V05/);
    rendered.clear();
});

test('an edited message is normalized before SillyTavern renders it, with no re-render of our own', async () => {
    ctx.chat = [{ is_user: false, is_system: false, mes: plainRope() }];
    rendered.add(0);
    emitted.length = 0;
    await emit('MESSAGE_EDITED', 0);
    assert.match(ctx.chat[0].mes, /<!-- INVENTORY_BLOCK_V05/, 'normalized by the time the awaited event returns');
    assert.ok(!emitted.some(entry => entry[0] === 'updateMessageBlock'));
    rendered.clear();
});

test('chat completion: prompts after the foreground one get no instructions', async () => {
    ctx.chat = [{ is_user: false, mes: block(100) }, { is_user: true, mes: 'buy' }, { is_user: false, mes: block(90) }];
    await emit('GENERATION_AFTER_COMMANDS', 'normal', {}, false);
    const foreground = { chat: [{ role: 'system', content: 'rules' }], dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', foreground);
    assert.match(JSON.stringify(foreground.chat), /CONTEXT_BEGIN/);
    // Another extension generates while the reply is still pending.
    const raw = { chat: [{ role: 'system', content: 'Summarize.' }, { role: 'assistant', content: `x\n${block(95)}` }, { role: 'assistant', content: `y\n${block(90)}` }], dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', raw);
    const text = JSON.stringify(raw.chat);
    assert.doesNotMatch(text, /CONTEXT_BEGIN/);
    assert.doesNotMatch(text, /95 Gold/);
    assert.match(text, /90 Gold/);
    await finish();
});

test('text completion: only the prompt carrying the context is foreground; the context is then withdrawn', async () => {
    ctx.mainApi = 'textgenerationwebui';
    ctx.chat = [{ is_user: false, mes: block(100) }, { is_user: true, mes: 'buy' }, { is_user: false, mes: block(90) }];
    await emit('GENERATION_AFTER_COMMANDS', 'normal', {}, false);
    const context = extensionPrompts.inventory_block;
    // A raw prompt from another extension arrives first: no marker, so it is background.
    const raw = { prompt: `Summarize:\n${block(100)}\n${block(90)}`, dryRun: false };
    await emit('GENERATE_AFTER_COMBINE_PROMPTS', raw);
    assert.doesNotMatch(raw.prompt, /CONTEXT_BEGIN|100 Gold/);
    assert.equal(extensionPrompts.inventory_block, context, 'context still registered for the real prompt');
    const foreground = { prompt: `Story.\n${context}\n${block(90)}`, dryRun: false };
    await emit('GENERATE_AFTER_COMBINE_PROMPTS', foreground);
    assert.equal((foreground.prompt.match(/CONTEXT_BEGIN/g) ?? []).length, 1);
    assert.equal(extensionPrompts.inventory_block, '', 'withdrawn once the foreground prompt is built');
    await finish();
    ctx.mainApi = 'openai';
});

test('chat completion keeps blocks written into user and system messages', async () => {
    const example = '<Inventory>\nExample | 1 | format\n</Inventory>';
    const event = { chat: [
        { role: 'system', content: `Card. Track items like:\n${example}` },
        { role: 'user', content: `My list:\n${example}` },
        { role: 'assistant', content: `Reply\n${block(90)}` },
    ], dryRun: false };
    await emit('CHAT_COMPLETION_PROMPT_READY', event);
    assert.equal((JSON.stringify(event.chat).match(/Example \| 1 \| format/g) ?? []).length, 2);
});

test('the watchdog clears a session whose generation never reported back', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        ctx.mainApi = 'textgenerationwebui';
        ctx.chat = [{ is_user: false, mes: block(90) }, { is_user: true, mes: 'go' }];
        await emit('GENERATION_AFTER_COMMANDS', 'normal', {}, false);
        assert.match(extensionPrompts.inventory_block, /CONTEXT_BEGIN/);
        mock.timers.tick(2 * 60 * 1000 + 1);
        assert.equal(extensionPrompts.inventory_block, '', 'session and its context cleared');
        const event = { chat: [{ role: 'assistant', content: block(90) }], dryRun: false };
        await emit('CHAT_COMPLETION_PROMPT_READY', event);
        assert.doesNotMatch(JSON.stringify(event.chat), /CONTEXT_BEGIN/, 'later prompts are background');
    } finally {
        mock.timers.reset();
        ctx.mainApi = 'openai';
    }
});

test('Rescan hides raw blocks, saves once and reports the current snapshot', async () => {
    ctx.chat = [{ is_user: false, is_system: false, mes: plainRope() }, { is_user: true, mes: 'hi' }, { is_user: false, is_system: false, mes: `Later.\n${block(80)}` }];
    let saves = 0;
    const save = ctx.saveChat;
    ctx.saveChat = async () => { saves++; };
    notices.length = 0;
    const wrapper = fixed['#extensions_settings'].children[0];
    for (const listener of wrapper.querySelector('#inventory_block_settings_refresh').listeners.click) listener();
    // The button handler fires the async rescan without returning it; let it settle.
    await new Promise(resolve => setTimeout(resolve, 20));
    ctx.saveChat = save;
    assert.match(ctx.chat[0].mes, /<!-- INVENTORY_BLOCK_V05/);
    assert.equal(saves, 1);
    assert.ok(notices.some(notice => /Hid 1 raw Inventory block/.test(notice) && /from message #2/.test(notice)), notices.join('\n'));
});
