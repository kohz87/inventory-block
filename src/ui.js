import { emptyInventory, formatInventoryBlock, normalizeInventory, parseInventoryBlock } from './snapshot.js';
import {
    DEFAULT_MAX_DEPTH,
    ROOT_NODE_ID,
    ancestorIds,
    buildInventoryTree,
    groupItems,
    inventoryItemKey,
    nodeIdForCategory,
    parentId,
    resolveNode,
    searchItems,
} from './tree.js';
import { diffInventories } from './diff.js';

const viewStateByKey = new Map();

function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function button(className, { text = '', title = '', icon = '' } = {}) {
    const node = el('button', className, text);
    node.type = 'button';
    if (title) {
        node.title = title;
        node.setAttribute('aria-label', title);
    }
    if (icon) node.prepend(el('i', `fa-solid ${icon}`));
    return node;
}

function itemCount(state) {
    return normalizeInventory(state).categories.reduce((sum, category) => sum + category.items.length, 0);
}

function plural(count, word = 'item') {
    return `${count} ${count === 1 ? word : `${word}s`}`;
}

export function formatQuantity(quantity) {
    const value = String(quantity ?? '').trim();
    return /^\d+(\.\d+)?$/.test(value) ? `×${value}` : value;
}

function viewState(uiKey) {
    const key = String(uiKey ?? 'default');
    if (!viewStateByKey.has(key)) {
        viewStateByKey.set(key, { selected: ROOT_NODE_ID, expanded: new Set(), query: '', changesOpen: false });
    }
    return viewStateByKey.get(key);
}

function describeValues(item) {
    return [formatQuantity(item?.quantity), item?.remark].filter(Boolean).join(' ') || '—';
}

export function describeChange(change) {
    const qty = value => (value?.quantity ? ` ${formatQuantity(value.quantity)}` : '');
    switch (change.type) {
        case 'added': return `+ ${change.name}${qty(change.after)}`;
        case 'removed': return `− ${change.name}${qty(change.before)}`;
        case 'moved': return `↪ ${change.name} → ${change.category.replaceAll(' > ', ' › ')}`;
        default: {
            const parts = [];
            if (change.before.quantity !== change.after.quantity) parts.push(`${formatQuantity(change.before.quantity) || '—'} → ${formatQuantity(change.after.quantity) || '—'}`);
            if (change.before.remark !== change.after.remark) parts.push(`${change.before.remark || '—'} → ${change.after.remark || '—'}`);
            return `~ ${change.name}: ${parts.join(', ') || describeValues(change.after)}`;
        }
    }
}

function stop(handler) {
    return event => {
        event.stopPropagation();
        handler(event);
    };
}

export function renderInventoryPane(pane, state, {
    onEdit,
    onCopy,
    hasSnapshot = true,
    uiKey = 'default',
    previousState = null,
    maxDepth = DEFAULT_MAX_DEPTH,
} = {}) {
    const inventory = normalizeInventory(state ?? emptyInventory());
    const view = viewState(uiKey);
    pane.replaceChildren();
    pane.classList.add('inventory-block-pane');

    const head = el('div', 'inventory-header');
    const titles = el('div', 'inventory-header-titles');
    titles.append(
        el('span', 'inventory-ledger-title', 'Inventory'),
        el('span', 'inventory-pane-summary', hasSnapshot ? plural(itemCount(inventory)) : 'No snapshot yet'),
    );
    head.appendChild(titles);
    const actions = el('div', 'inventory-header-actions');
    if (onEdit) {
        const edit = button('menu_button inventory-icon-button', { title: 'Edit Inventory', icon: 'fa-pen-to-square' });
        edit.addEventListener('click', stop(() => onEdit()));
        actions.appendChild(edit);
    }
    if (onCopy) {
        const copy = button('menu_button inventory-icon-button', { title: 'Copy Block', icon: 'fa-copy' });
        copy.addEventListener('click', stop(() => onCopy()));
        actions.appendChild(copy);
    }
    head.appendChild(actions);
    pane.appendChild(head);

    if (!hasSnapshot) {
        pane.appendChild(el('div', 'inventory-empty-state', 'No valid <Inventory> snapshot exists in this chat yet.'));
        return;
    }
    if (!inventory.categories.length || itemCount(inventory) === 0) {
        pane.appendChild(el('div', 'inventory-empty-state', 'Inventory is empty.'));
        return;
    }

    const tree = buildInventoryTree(inventory, { maxDepth });
    const changes = diffInventories(previousState, inventory);
    const changedNodes = new Set();
    const changedItems = new Map();
    for (const change of changes) {
        for (const category of [change.category, change.previousCategory].filter(Boolean)) {
            ancestorIds(nodeIdForCategory(category, maxDepth)).forEach(id => changedNodes.add(id));
        }
        if (change.type !== 'removed') changedItems.set(inventoryItemKey(change.category, change.name), change.type);
    }

    const search = el('div', 'inventory-search');
    const input = el('input', 'text_pole inventory-search-input');
    input.type = 'search';
    input.placeholder = 'Filter items…';
    input.setAttribute('aria-label', 'Filter inventory items');
    input.value = view.query;
    search.appendChild(input);
    pane.appendChild(search);

    const browser = el('div', 'inventory-browser');

    const select = (id, { focus = false } = {}) => {
        view.selected = id;
        ancestorIds(id).forEach(ancestor => view.expanded.add(ancestor));
        if (view.query) {
            view.query = '';
            input.value = '';
        }
        renderBrowser(focus ? id : null);
    };

    if (changes.length) {
        const strip = el('details', 'inventory-changes');
        strip.open = view.changesOpen;
        const summary = el('summary', 'inventory-changes-summary');
        summary.append(
            el('span', 'inventory-changes-label', `Δ ${plural(changes.length, 'change')}`),
            el('span', 'inventory-changes-preview', changes.map(describeChange).join('   ')),
        );
        strip.appendChild(summary);
        const list = el('ul', 'inventory-changes-list');
        for (const change of changes) {
            const li = el('li', `inventory-change is-${change.type}`);
            const target = button('inventory-change-link', { text: describeChange(change), title: `Show ${change.category.replaceAll(' > ', ' › ')}` });
            target.addEventListener('click', stop(() => select(resolveNode(tree, nodeIdForCategory(change.category, maxDepth)).id)));
            li.appendChild(target);
            list.appendChild(li);
        }
        strip.appendChild(list);
        strip.addEventListener('toggle', () => { view.changesOpen = strip.open; });
        pane.appendChild(strip);
    }

    pane.appendChild(browser);

    function changeDot(node) {
        if (!changedNodes.has(node.id)) return null;
        const dot = el('span', 'inventory-change-dot');
        dot.title = 'Changed since the previous snapshot';
        return dot;
    }

    function nodeLabel(node, text = node.name) {
        const label = el('span', 'inventory-node-name', text);
        label.title = node.path.join(' › ') || text;
        return label;
    }

    function renderTree(selected) {
        const nav = el('nav', 'inventory-tree');
        nav.setAttribute('aria-label', 'Inventory categories');
        const list = el('ul', 'inventory-tree-list');

        const renderRow = (node, depth, text = node.name) => {
            const li = el('li', 'inventory-tree-item');
            const row = el('div', 'inventory-tree-row');
            row.style.setProperty('--inventory-depth', String(depth));
            const expanded = view.expanded.has(node.id);
            if (node.children.length && node.id !== ROOT_NODE_ID) {
                const toggle = button('inventory-tree-toggle', { text: expanded ? '▾' : '▸', title: expanded ? `Collapse ${node.name}` : `Expand ${node.name}` });
                toggle.setAttribute('aria-expanded', String(expanded));
                toggle.addEventListener('click', stop(() => {
                    if (expanded) view.expanded.delete(node.id);
                    else view.expanded.add(node.id);
                    renderBrowser(node.id);
                }));
                row.appendChild(toggle);
            } else {
                row.appendChild(el('span', 'inventory-tree-spacer'));
            }
            const label = button(`inventory-tree-label${node === selected ? ' is-selected' : ''}`);
            label.dataset.nodeId = node.id;
            if (node === selected) label.setAttribute('aria-current', 'true');
            label.append(nodeLabel(node, text), el('span', 'inventory-node-count', String(node.total)));
            const dot = changeDot(node);
            if (dot) label.appendChild(dot);
            label.addEventListener('click', stop(() => select(node.id, { focus: true })));
            row.appendChild(label);
            li.appendChild(row);
            if (node.children.length && expanded && node.id !== ROOT_NODE_ID) {
                const group = el('ul', 'inventory-tree-list');
                node.children.forEach(child => group.appendChild(renderRow(child, depth + 1)));
                li.appendChild(group);
            }
            return li;
        };

        list.appendChild(renderRow(tree, 0, 'All'));
        tree.children.forEach(child => list.appendChild(renderRow(child, 0)));
        nav.appendChild(list);
        nav.addEventListener('keydown', event => handleTreeKey(event, nav));
        return nav;
    }

    function handleTreeKey(event, nav) {
        const labels = [...nav.querySelectorAll('.inventory-tree-label')];
        const index = labels.indexOf(document.activeElement);
        if (index < 0) return;
        const id = labels[index].dataset.nodeId;
        const node = resolveNode(tree, id);
        let handled = true;
        if (event.key === 'ArrowDown') labels[Math.min(labels.length - 1, index + 1)].focus();
        else if (event.key === 'ArrowUp') labels[Math.max(0, index - 1)].focus();
        else if (event.key === 'Home') labels[0].focus();
        else if (event.key === 'End') labels.at(-1).focus();
        else if (event.key === 'ArrowRight' && node.children.length && node.id && !view.expanded.has(node.id)) {
            view.expanded.add(node.id);
            renderBrowser(node.id);
        } else if (event.key === 'ArrowLeft' && node.id && view.expanded.has(node.id)) {
            view.expanded.delete(node.id);
            renderBrowser(node.id);
        } else if (event.key === 'ArrowLeft' && node.id) {
            const parent = parentId(node.id);
            nav.querySelector(`.inventory-tree-label[data-node-id="${CSS.escape(parent)}"]`)?.focus();
        } else handled = false;
        if (handled) {
            // SillyTavern binds arrow keys to swipes at document level.
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function renderCrumbs(selected) {
        const bar = el('div', 'inventory-location');
        if (selected !== tree) {
            const back = button('inventory-back', { text: '‹', title: 'Back' });
            back.addEventListener('click', stop(() => select(parentId(selected.id))));
            bar.appendChild(back);
        }
        const crumbs = el('ol', 'inventory-crumbs');
        const trail = [tree, ...ancestorIds(selected.id).map(id => resolveNode(tree, id))];
        const collapsible = trail.length > 3;
        trail.forEach((node, index) => {
            const last = index === trail.length - 1;
            if (collapsible && index === 1) {
                const more = el('li', 'inventory-crumb inventory-crumb-ellipsis');
                const up = button('inventory-crumb-button', { text: '…', title: 'Up one level' });
                up.addEventListener('click', stop(() => select(parentId(selected.id))));
                more.appendChild(up);
                crumbs.appendChild(more);
            }
            const middle = collapsible && index > 0 && index < trail.length - 1;
            const crumb = el('li', `inventory-crumb${middle ? ' is-middle' : ''}${last ? ' is-current' : ''}`);
            const name = node === tree ? 'All' : node.name;
            if (last) {
                crumb.appendChild(el('span', 'inventory-crumb-current', name));
                crumb.setAttribute('aria-current', 'location');
            } else {
                const link = button('inventory-crumb-button', { text: name });
                link.addEventListener('click', stop(() => select(node.id)));
                crumb.appendChild(link);
            }
            crumbs.appendChild(crumb);
        });
        bar.appendChild(crumbs);
        bar.appendChild(el('span', 'inventory-location-count', plural(selected.total)));
        return bar;
    }

    function renderSiblings(selected) {
        if (selected === tree) return null;
        const parent = resolveNode(tree, parentId(selected.id));
        if (parent.children.length < 2 || parent.children.length > 8) return null;
        const row = el('div', 'inventory-siblings');
        for (const sibling of parent.children) {
            const chip = button(`inventory-chip${sibling === selected ? ' is-selected' : ''}`);
            chip.append(nodeLabel(sibling), el('span', 'inventory-node-count', String(sibling.total)));
            const dot = changeDot(sibling);
            if (dot) chip.appendChild(dot);
            if (sibling === selected) chip.setAttribute('aria-current', 'true');
            chip.addEventListener('click', stop(() => select(sibling.id)));
            row.appendChild(chip);
        }
        return row;
    }

    function renderChildren(selected) {
        if (!selected.children.length) return null;
        const list = el('div', 'inventory-children');
        for (const child of selected.children) {
            const row = button('inventory-child');
            row.append(nodeLabel(child), el('span', 'inventory-node-count', String(child.total)));
            const dot = changeDot(child);
            if (dot) row.appendChild(dot);
            row.appendChild(el('span', 'inventory-child-chevron', '›'));
            row.addEventListener('click', stop(() => select(child.id)));
            list.appendChild(row);
        }
        return list;
    }

    function renderItem(item, { path = '' } = {}) {
        const change = changedItems.get(inventoryItemKey(item.category, item.name));
        const row = el('div', `inventory-item${change ? ` is-${change}` : ''}`);
        const name = el('div', 'inventory-item-name');
        name.appendChild(el('span', 'inventory-item-label', item.name));
        if (path) name.appendChild(el('span', 'inventory-item-path', path));
        row.append(
            name,
            el('div', 'inventory-item-qty', formatQuantity(item.quantity)),
            el('div', 'inventory-item-remark', item.remark),
        );
        if (change) row.title = change === 'added' ? 'New since the previous snapshot' : change === 'moved' ? 'Moved since the previous snapshot' : 'Changed since the previous snapshot';
        return row;
    }

    function renderItems(selected) {
        const container = el('div', 'inventory-items');
        const groups = groupItems(selected);
        for (const group of groups) {
            const section = el('section', `inventory-group${group.own ? ' is-own' : ' is-descendant'}`);
            if (group.label) section.appendChild(el('h4', 'inventory-group-title', group.label));
            if (!group.items.length) section.appendChild(el('div', 'inventory-empty-state', 'No items'));
            group.items.forEach(item => section.appendChild(renderItem(item)));
            container.appendChild(section);
        }
        return container;
    }

    function renderResults() {
        const container = el('div', 'inventory-items inventory-results');
        const results = searchItems(tree, view.query);
        container.appendChild(el('div', 'inventory-results-summary', `${plural(results.length, 'match')} for “${view.query.trim()}”`));
        for (const { item, node } of results) container.appendChild(renderItem(item, { path: node.path.join(' › ') }));
        return container;
    }

    function renderBrowser(focusId = null) {
        const selected = resolveNode(tree, view.selected);
        view.selected = selected.id;
        const searching = Boolean(view.query.trim());
        browser.classList.toggle('is-searching', searching);
        browser.replaceChildren();
        browser.appendChild(renderTree(selected));

        const main = el('div', 'inventory-main');
        if (searching) {
            main.appendChild(renderResults());
        } else {
            main.appendChild(renderCrumbs(selected));
            const siblings = renderSiblings(selected);
            if (siblings) main.appendChild(siblings);
            const children = renderChildren(selected);
            if (children) main.appendChild(children);
            main.appendChild(renderItems(selected));
        }
        browser.appendChild(main);

        const chips = main.querySelector('.inventory-siblings');
        const current = chips?.querySelector('.inventory-chip.is-selected');
        if (chips && current) chips.scrollLeft = Math.max(0, current.offsetLeft - chips.offsetLeft - 24);

        if (focusId !== null) {
            browser.querySelector(`.inventory-tree-label[data-node-id="${CSS.escape(focusId)}"]`)?.focus({ preventScroll: true });
        }
    }

    input.addEventListener('input', () => {
        view.query = input.value;
        renderBrowser();
    });
    input.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Escape' && input.value) {
            input.value = '';
            view.query = '';
            renderBrowser();
        }
    });
    search.addEventListener('click', event => event.stopPropagation());

    renderBrowser();
}

function toastError(error) {
    globalThis.toastr?.error(error instanceof Error ? error.message : String(error), 'Inventory Block');
}

export async function openInventoryEditor(context, state, { onSave } = {}) {
    const root = el('div', 'inventory-editor');
    root.appendChild(el('div', 'inventory-editor-note', 'This edits the current full message-native <Inventory> snapshot. Use [Parent > Child] headers for sub-categories. No hidden backend state is involved.'));
    const textarea = document.createElement('textarea');
    textarea.className = 'text_pole inventory-editor-textarea';
    textarea.value = formatInventoryBlock(state ?? emptyInventory());
    textarea.spellcheck = false;
    root.appendChild(textarea);

    if (!context?.Popup || !context?.POPUP_TYPE) {
        const edited = globalThis.prompt?.('Edit Inventory block', textarea.value);
        if (edited === null || edited === undefined) return false;
        try {
            const parsed = parseInventoryBlock(edited);
            await onSave?.(parsed);
            return true;
        } catch (error) {
            toastError(error);
            return false;
        }
    }

    let saved = false;
    const popup = new context.Popup(root, context.POPUP_TYPE.CONFIRM, '', {
        okButton: 'Save Inventory',
        cancelButton: 'Cancel',
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        onClosing: async closingPopup => {
            if (closingPopup.result !== context.POPUP_RESULT?.AFFIRMATIVE) return true;
            try {
                const parsed = parseInventoryBlock(textarea.value);
                await onSave?.(parsed);
                saved = true;
                return true;
            } catch (error) {
                toastError(error);
                return false;
            }
        },
    });
    await popup.show();
    return saved;
}

export async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement('textarea');
    textarea.value = String(text ?? '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}
