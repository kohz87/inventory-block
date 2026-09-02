import test from 'node:test';
import assert from 'node:assert/strict';
import { mountExtensionUi, settingsMarkup } from '../src/settings.js';

class FakeNode {
    constructor(tag = 'div') {
        this.tag = tag;
        this.children = [];
        this.listeners = new Map();
        this.id = '';
        this.className = '';
        this.title = '';
        this._innerHTML = '';
        this.virtual = new Map();
    }
    set innerHTML(value) {
        this._innerHTML = String(value);
        for (const id of ['inventory_block_settings_edit', 'inventory_block_settings_history', 'inventory_block_settings_copy', 'inventory_block_history_retention', 'inventory_block_history_trim', 'inventory_block_history_clear']) {
            if (this._innerHTML.includes(`id="${id}"`)) {
                const node = new FakeNode(id === 'inventory_block_history_retention' ? 'select' : 'button');
                node.id = id;
                this.virtual.set(`#${id}`, node);
            }
        }
    }
    get innerHTML() { return this._innerHTML; }
    appendChild(node) { this.children.push(node); return node; }
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    click() { this.listeners.get('click')?.({ stopPropagation() {}, preventDefault() {} }); }
    querySelector(selector) {
        if (this.virtual.has(selector)) return this.virtual.get(selector);
        if (selector.startsWith('#')) {
            const id = selector.slice(1);
            for (const child of this.children) {
                if (child.id === id) return child;
                const nested = child.querySelector(selector);
                if (nested) return nested;
            }
        }
        return null;
    }
}

class FakeDocument extends FakeNode {
    constructor() {
        super('document');
        this.extensionsMenu = new FakeNode('div');
        this.extensionsMenu.id = 'extensionsMenu';
        this.settings = new FakeNode('div');
        this.settings.id = 'extensions_settings';
        this.children.push(this.extensionsMenu, this.settings);
    }
    createElement(tag) { return new FakeNode(tag); }
}

test('settings markup is a standard SillyTavern inline drawer', () => {
    const html = settingsMarkup('0.2.3');
    assert.match(html, /inline-drawer-toggle inline-drawer-header/);
    assert.match(html, /inline-drawer-content/);
    assert.match(html, /v0\.2\.3/);
});

test('menu/settings DOM mount is idempotent and buttons are actually wired', () => {
    const documentRef = new FakeDocument();
    let edit = 0;
    let history = 0;
    let copy = 0;
    const options = { version: '0.2.3', onEdit: () => edit++, onHistory: () => history++, onCopy: () => copy++ };
    const first = mountExtensionUi(documentRef, options);
    const second = mountExtensionUi(documentRef, options);
    assert.deepEqual(first, { menuReady: true, settingsReady: true });
    assert.deepEqual(second, { menuReady: true, settingsReady: true });
    assert.equal(documentRef.extensionsMenu.children.length, 1);
    assert.equal(documentRef.settings.children.length, 1);
    documentRef.querySelector('#inventory_block_menu').click();
    const settings = documentRef.querySelector('#inventory_block_settings');
    settings.querySelector('#inventory_block_settings_edit').click();
    settings.querySelector('#inventory_block_settings_history').click();
    settings.querySelector('#inventory_block_settings_copy').click();
    assert.deepEqual({ edit, history, copy }, { edit: 2, history: 1, copy: 1 });
    assert.ok(settings.querySelector('#inventory_block_history_retention').listeners.has('change'));
    assert.ok(settings.querySelector('#inventory_block_history_trim').listeners.has('click'));
    assert.ok(settings.querySelector('#inventory_block_history_clear').listeners.has('click'));
    assert.ok(settings.querySelector('#inventory_block_history_retention').listeners.has('change'));
    assert.ok(settings.querySelector('#inventory_block_history_trim').listeners.has('click'));
    assert.ok(settings.querySelector('#inventory_block_history_clear').listeners.has('click'));
    assert.ok(settings.querySelector('#inventory_block_history_retention').listeners.has('change'));
    assert.ok(settings.querySelector('#inventory_block_history_trim').listeners.has('click'));
    assert.ok(settings.querySelector('#inventory_block_history_clear').listeners.has('click'));
});
