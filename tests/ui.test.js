// Renders the Inventory pane against a minimal fake DOM so UI behaviour is covered in CI.
import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
    constructor(tag) {
        this.tagName = tag.toUpperCase();
        this.children = [];
        this.parent = null;
        this.attributes = {};
        this.dataset = {};
        this.listeners = {};
        this.style = { setProperty() {} };
        this.className = '';
        this.ownText = '';
        this.value = '';
        this.open = false;
        this.scrollLeft = 0;
        this.offsetLeft = 0;
        const element = this;
        this.classList = {
            add: (...names) => names.forEach(name => { if (!element.classes().includes(name)) element.className = `${element.className} ${name}`.trim(); }),
            remove: name => { element.className = element.classes().filter(item => item !== name).join(' '); },
            toggle: (name, force) => (force ?? !element.classes().includes(name)) ? element.classList.add(name) : element.classList.remove(name),
            contains: name => element.classes().includes(name),
        };
    }
    classes() { return this.className.split(/\s+/).filter(Boolean); }
    set textContent(value) { this.children = []; this.ownText = String(value); }
    get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
    prepend(node) { node.parent = this; this.children.unshift(node); }
    appendChild(node) { node.parent = this; this.children.push(node); return node; }
    replaceChildren() { this.children = []; this.ownText = ''; }
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
    dispatch(type) { (this.listeners[type] ?? []).forEach(fn => fn({ type, stopPropagation() {}, preventDefault() {}, target: this })); }
    click() { this.dispatch('click'); }
    focus() { globalThis.document.activeElement = this; }
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
    contains(node) { for (let n = node; n; n = n.parent) if (n === this) return true; return false; }
    descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
    matches(selector) {
        const classes = [...selector.matchAll(/\.([\w-]+)/g)].map(match => match[1]);
        const id = /\[data-node-id="([^"]*)"\]/.exec(selector);
        return classes.every(name => this.classes().includes(name)) && (!id || this.dataset.nodeId === id[1]);
    }
    // Supports compound selectors and the descendant combinator (`.a .b`).
    matchesPath(parts) {
        if (!this.matches(parts.at(-1))) return false;
        let rest = parts.slice(0, -1);
        for (let n = this.parent; n && rest.length; n = n.parent) if (n.matches(rest.at(-1))) rest = rest.slice(0, -1);
        return rest.length === 0;
    }
    querySelectorAll(selector) {
        const parts = selector.trim().split(/\s+/);
        return this.descendants().filter(node => node.matchesPath(parts));
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
}

globalThis.document = { createElement: tag => new FakeElement(tag), activeElement: null };
globalThis.CSS = { escape: value => String(value) };

const { renderInventoryPane } = await import('../src/ui.js');
const { parseInventoryBlock } = await import('../src/snapshot.js');

const current = parseInventoryBlock(`<Inventory>
Coin Pouch | 1 | 85 Gold
[Wagon > Food > Preserved]
Salt Pork | 3 | Barrel
[Wagon > Tools]
Tarp | 1 | Folded
[Lent to Companions > Astra]
Spare Cloak | 1 |
</Inventory>`);
const previous = parseInventoryBlock(`<Inventory>
Coin Pouch | 1 | 100 Gold
Spare Cloak | 1 |
[Wagon > Food > Preserved]
Salt Pork | 3 | Barrel
</Inventory>`);

function render(options = {}) {
    const pane = new FakeElement('div');
    renderInventoryPane(pane, current, { previousState: previous, uiKey: `k${Math.random()}`, onEdit() {}, onCopy() {}, ...options });
    return pane;
}
const texts = (pane, selector) => pane.querySelectorAll(selector).map(node => node.textContent);

test('header, tree and item count', () => {
    const pane = render();
    assert.equal(pane.querySelector('.inventory-pane-summary').textContent, '4 items');
    assert.deepEqual(texts(pane, '.inventory-tree-label .inventory-node-name'), ['All', 'General', 'Wagon', 'Lent to Companions']);
    assert.equal(pane.querySelectorAll('.inventory-icon-button').length, 2);
});

test('change strip lists added, changed and moved items and marks changed categories', () => {
    const pane = render();
    assert.match(pane.querySelector('.inventory-changes-label').textContent, /^Δ 3 changes$/);
    assert.deepEqual(texts(pane, '.inventory-change-link'), [
        '+ Tarp ×1',
        '~ Coin Pouch: 100 Gold → 85 Gold',
        '↪ Spare Cloak → Lent to Companions › Astra',
    ]);
    const wagon = pane.querySelector('.inventory-tree-label[data-node-id="wagon"]');
    assert.ok(wagon.querySelector('.inventory-change-dot'), 'Wagon holds the added Tarp');
    assert.match(render({ changesFromEarlierReply: true }).querySelector('.inventory-changes-label').textContent, /earlier reply/);
});

test('selecting a parent shows its subtree grouped by sub-category', () => {
    const pane = render();
    pane.querySelector('.inventory-tree-label[data-node-id="wagon"]').click();
    assert.match(pane.querySelector('.inventory-crumbs').textContent, /All.*Wagon/);
    assert.deepEqual(texts(pane, '.inventory-group-title'), ['Food › Preserved', 'Tools']);
    assert.deepEqual(texts(pane, '.inventory-item-label'), ['Salt Pork', 'Tarp']);
    assert.deepEqual(texts(pane, '.inventory-child .inventory-node-name'), ['Food', 'Tools'], 'drill-down rows for narrow layouts');
});

test('filter searches the whole tree and shows each match\'s path', () => {
    const pane = render();
    const input = pane.querySelector('.inventory-search-input');
    input.value = 'cloak';
    input.dispatch('input');
    assert.match(pane.querySelector('.inventory-results-summary').textContent, /^1 match for/);
    assert.deepEqual(texts(pane, '.inventory-item-path'), ['Lent to Companions › Astra']);
});

test('empty and missing snapshots', () => {
    const none = new FakeElement('div');
    renderInventoryPane(none, null, { hasSnapshot: false, uiKey: 'none' });
    assert.match(none.textContent, /No valid <Inventory> snapshot/);
    const empty = new FakeElement('div');
    renderInventoryPane(empty, { categories: [] }, { uiKey: 'empty' });
    assert.match(empty.textContent, /Inventory is empty/);
});
