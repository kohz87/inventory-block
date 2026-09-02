import { LIMITS, ROOT_CATEGORY, VERSION } from './constants.js';
import { ensureRoot, getInventoryAt, identityKey, listRevisions, normalizeInventory, validateAndNormalizeInventory } from './state.js';
import { isRootCategoryName } from './protocol.js';

const clone = value => structuredClone(value);
const sectionStateByChat = new Map();

function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '') node.textContent = text;
    return node;
}

function iconButton(icon, title, className = '') {
    const button = el('button', `inventory-icon-button ${className}`.trim());
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    return button;
}

function textButton(icon, label) {
    const button = el('button', 'inventory-text-button');
    button.type = 'button';
    button.innerHTML = `<i class="fa-solid ${icon}"></i><span>${label}</span>`;
    return button;
}

function itemCount(state) {
    return normalizeInventory(state).categories.reduce((sum, category) => sum + category.items.length, 0);
}

function displayQuantity(value) {
    const text = String(value ?? '').trim();
    return text ? `×${text}` : '';
}

function appendItemRows(container, items) {
    for (const item of items) {
        const row = el('div', 'inventory-row');
        const name = el('div', 'inventory-cell inventory-name', item.name);
        const quantity = el('div', 'inventory-cell inventory-quantity', displayQuantity(item.quantity));
        const remark = el('div', 'inventory-cell inventory-remark', item.remark);
        name.title = item.name;
        quantity.title = String(item.quantity ?? '');
        remark.title = item.remark;
        row.append(name, quantity, remark);
        container.appendChild(row);
    }
}

function sectionUiState(uiKey) {
    const key = String(uiKey ?? 'default');
    if (sectionStateByChat.has(key)) {
        const value = sectionStateByChat.get(key);
        sectionStateByChat.delete(key);
        sectionStateByChat.set(key, value);
        return value;
    }
    const value = { initialized: false, open: new Set() };
    sectionStateByChat.set(key, value);
    while (sectionStateByChat.size > LIMITS.uiChats) {
        const oldest = sectionStateByChat.keys().next().value;
        sectionStateByChat.delete(oldest);
    }
    return value;
}

export function renderInventoryPane(pane, state, { uiKey = 'default', onEdit, onCopy, onHistory } = {}) {
    const inventory = normalizeInventory(state);
    const uiState = sectionUiState(uiKey);
    const remembered = uiState.open;
    const root = inventory.categories.find(category => isRootCategoryName(category.name));
    const sections = inventory.categories.filter(category => !isRootCategoryName(category.name));
    const totalItems = itemCount(inventory);

    pane.replaceChildren();
    pane.classList.add('inventory-block-pane');
    const heading = el('div', 'inventory-ledger-heading');
    heading.appendChild(el('div', 'inventory-ledger-title', 'Inventory Ledger'));
    heading.appendChild(el('div', 'inventory-pane-summary', `${totalItems} item${totalItems === 1 ? '' : 's'} · ${sections.length} section${sections.length === 1 ? '' : 's'}`));
    pane.appendChild(heading);

    const toolbar = el('div', 'inventory-pane-toolbar');
    const primaryActions = el('div', 'inventory-pane-actions');
    if (onEdit) {
        const edit = textButton('fa-pen-to-square', 'Edit inventory');
        edit.addEventListener('click', event => { event.stopPropagation(); onEdit(); });
        primaryActions.appendChild(edit);
    }
    if (onCopy) {
        const copy = textButton('fa-copy', 'Copy block');
        copy.addEventListener('click', event => { event.stopPropagation(); onCopy(); });
        primaryActions.appendChild(copy);
    }
    toolbar.appendChild(primaryActions);
    if (onHistory) {
        const history = iconButton('fa-clock-rotate-left', 'Inventory history');
        history.addEventListener('click', event => { event.stopPropagation(); onHistory(); });
        toolbar.appendChild(history);
    }
    pane.appendChild(toolbar);

    if (totalItems === 0 && sections.length === 0) {
        pane.appendChild(el('div', 'inventory-empty-state', 'Inventory is empty.'));
        return;
    }
    if (root?.items.length) {
        const rootTable = el('div', 'inventory-table inventory-root-table');
        appendItemRows(rootTable, root.items);
        pane.appendChild(rootTable);
    }
    sections.forEach((category, index) => {
        const section = el('details', 'inventory-category');
        const categoryKey = category.name.toLocaleLowerCase();
        section.open = remembered.has(categoryKey) || (!uiState.initialized && index === 0);
        if (section.open) remembered.add(categoryKey);
        const title = el('summary', 'inventory-category-title');
        title.appendChild(el('span', 'inventory-category-name', category.name));
        const count = el('span', 'inventory-category-count');
        count.appendChild(el('span', 'inventory-category-count-number', String(category.items.length)));
        count.appendChild(el('span', 'inventory-category-count-label', category.items.length === 1 ? 'ITEM' : 'ITEMS'));
        title.appendChild(count);
        const chevron = el('span', 'inventory-category-chevron');
        chevron.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        title.appendChild(chevron);
        section.appendChild(title);
        section.addEventListener('toggle', () => {
            if (section.open) remembered.add(categoryKey);
            else remembered.delete(categoryKey);
        });
        const table = el('div', 'inventory-table');
        if (category.items.length) appendItemRows(table, category.items);
        else table.appendChild(el('div', 'inventory-category-empty', 'No items'));
        section.appendChild(table);
        pane.appendChild(section);
    });
    uiState.initialized = true;
}

function makeInput(value, placeholder, className = '') {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(value ?? '');
    input.placeholder = placeholder;
    input.className = `text_pole ${className}`.trim();
    return input;
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toastError(error) {
    const message = error?.validationErrors?.join(' ') || (error instanceof Error ? error.message : String(error));
    globalThis.toastr?.error(message, 'Inventory Block');
}

export async function openInventoryEditor(context, currentState, { onSave } = {}) {
    let draft = normalizeInventory(clone(currentState));
    const root = el('div', 'inventory-editor');
    const toolbar = el('div', 'inventory-editor-toolbar');
    const addCategory = el('button', 'menu_button', 'Add Category');
    const exportButton = el('button', 'menu_button', 'Export JSON');
    const importButton = el('button', 'menu_button', 'Import JSON');
    const clearButton = el('button', 'menu_button', 'Clear');
    for (const button of [addCategory, exportButton, importButton, clearButton]) button.type = 'button';
    toolbar.append(addCategory, exportButton, importButton, clearButton);
    root.appendChild(toolbar);
    const list = el('div', 'inventory-editor-list');
    root.appendChild(list);

    function renderDraft() {
        list.replaceChildren();
        if (!draft.categories.length) {
            list.appendChild(el('div', 'inventory-empty-state', 'No categories yet. Add one to start the inventory.'));
            return;
        }
        draft.categories.forEach((category, categoryIndex) => {
            const card = el('div', 'inventory-editor-category');
            const header = el('div', 'inventory-editor-category-head');
            const categoryName = makeInput(category.name, 'Category name', 'inventory-category-input');
            categoryName.addEventListener('input', () => { category.name = categoryName.value; });
            header.appendChild(categoryName);
            const moveUp = iconButton('fa-arrow-up', 'Move category up');
            moveUp.disabled = categoryIndex === 0;
            moveUp.addEventListener('click', () => {
                if (categoryIndex <= 0) return;
                [draft.categories[categoryIndex - 1], draft.categories[categoryIndex]] = [draft.categories[categoryIndex], draft.categories[categoryIndex - 1]];
                renderDraft();
            });
            const moveDown = iconButton('fa-arrow-down', 'Move category down');
            moveDown.disabled = categoryIndex === draft.categories.length - 1;
            moveDown.addEventListener('click', () => {
                if (categoryIndex >= draft.categories.length - 1) return;
                [draft.categories[categoryIndex + 1], draft.categories[categoryIndex]] = [draft.categories[categoryIndex], draft.categories[categoryIndex + 1]];
                renderDraft();
            });
            const removeCategory = iconButton('fa-trash', 'Delete category', 'inventory-danger-button');
            removeCategory.addEventListener('click', () => { draft.categories.splice(categoryIndex, 1); renderDraft(); });
            header.append(moveUp, moveDown, removeCategory);
            card.appendChild(header);

            const columnHeader = el('div', 'inventory-editor-row inventory-editor-header');
            columnHeader.append(el('div', '', 'Name'), el('div', '', 'Quantity'), el('div', '', 'Remark'), el('div'));
            card.appendChild(columnHeader);
            category.items.forEach((item, itemIndex) => {
                const row = el('div', 'inventory-editor-row');
                const name = makeInput(item.name, 'Name');
                const quantity = makeInput(item.quantity, 'Quantity');
                const remark = makeInput(item.remark, 'Remark');
                name.addEventListener('input', () => { item.name = name.value; });
                quantity.addEventListener('input', () => { item.quantity = quantity.value; });
                remark.addEventListener('input', () => { item.remark = remark.value; });
                const remove = iconButton('fa-xmark', 'Delete item', 'inventory-danger-button');
                remove.addEventListener('click', () => { category.items.splice(itemIndex, 1); renderDraft(); });
                row.append(name, quantity, remark, remove);
                card.appendChild(row);
            });
            const addItem = el('button', 'menu_button inventory-add-item', 'Add Item');
            addItem.type = 'button';
            addItem.addEventListener('click', () => { category.items.push({ name: '', quantity: '1', remark: '' }); renderDraft(); });
            card.appendChild(addItem);
            list.appendChild(card);
        });
    }

    addCategory.addEventListener('click', () => {
        const name = draft.categories.some(category => category.name === ROOT_CATEGORY) ? `Category ${draft.categories.length + 1}` : ROOT_CATEGORY;
        draft.categories.push({ name, items: [] });
        renderDraft();
    });
    exportButton.addEventListener('click', () => {
        try { downloadJson(`inventory-block-v${VERSION}.json`, validateAndNormalizeInventory(draft)); }
        catch (error) { toastError(error); }
    });
    importButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                draft = validateAndNormalizeInventory(JSON.parse(await file.text()));
                renderDraft();
            } catch (error) {
                toastError(error);
            }
        }, { once: true });
        input.click();
    });
    clearButton.addEventListener('click', () => { draft = { categories: [] }; renderDraft(); });
    renderDraft();

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
                const normalized = validateAndNormalizeInventory(draft);
                if (onSave) await onSave(normalized);
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

function flattenInventory(state) {
    const flat = new Map();
    for (const category of normalizeInventory(state).categories) {
        for (const item of category.items) {
            flat.set(`${identityKey(category.name)}\u0000${identityKey(item.name)}`, {
                category: category.name,
                item: clone(item),
            });
        }
    }
    return flat;
}

export function compareInventoryStates(beforeState, afterState) {
    const beforeInventory = normalizeInventory(beforeState);
    const afterInventory = normalizeInventory(afterState);
    const before = flattenInventory(beforeInventory);
    const after = flattenInventory(afterInventory);
    const added = [];
    const removed = [];
    const changed = [];
    for (const [key, entry] of before) {
        const next = after.get(key);
        if (!next) {
            removed.push(entry);
            continue;
        }
        if (entry.category !== next.category || entry.item.name !== next.item.name || entry.item.quantity !== next.item.quantity || entry.item.remark !== next.item.remark) {
            changed.push({ before: entry, after: next });
        }
    }
    for (const [key, entry] of after) if (!before.has(key)) added.push(entry);
    const beforeEmpty = new Map(beforeInventory.categories.filter(category => !category.items.length).map(category => [identityKey(category.name), category.name]));
    const afterEmpty = new Map(afterInventory.categories.filter(category => !category.items.length).map(category => [identityKey(category.name), category.name]));
    const categoriesAdded = [...afterEmpty].filter(([key]) => !beforeEmpty.has(key)).map(([, name]) => name);
    const categoriesRemoved = [...beforeEmpty].filter(([key]) => !afterEmpty.has(key)).map(([, name]) => name);
    return { added, removed, changed, categoriesAdded, categoriesRemoved };
}

function appendInventorySnapshot(container, state) {
    const inventory = normalizeInventory(state);
    const total = itemCount(inventory);
    if (!total) {
        container.appendChild(el('div', 'inventory-empty-state', 'Inventory is empty.'));
        return;
    }
    for (const category of inventory.categories) {
        const section = el('div', 'inventory-history-snapshot-section');
        section.appendChild(el('div', 'inventory-history-snapshot-category', category.name));
        const table = el('div', 'inventory-table');
        if (category.items.length) appendItemRows(table, category.items);
        else table.appendChild(el('div', 'inventory-category-empty', 'No items'));
        section.appendChild(table);
        container.appendChild(section);
    }
}

function itemSummary(entry) {
    const quantity = String(entry.item.quantity ?? '').trim();
    const remark = String(entry.item.remark ?? '').trim();
    return [entry.item.name, quantity ? `×${quantity}` : '', remark].filter(Boolean).join(' · ');
}

function appendDiffEntry(container, title, detail, className = '') {
    const row = el('div', `inventory-history-diff-entry ${className}`.trim());
    row.appendChild(el('div', 'inventory-history-diff-title', title));
    if (detail) row.appendChild(el('div', 'inventory-history-diff-detail', detail));
    container.appendChild(row);
}

function renderComparison(container, fromRevision, toRevision, beforeState, afterState) {
    container.replaceChildren();
    container.appendChild(el('div', 'inventory-history-inspector-title', `Revision ${fromRevision.id} → Revision ${toRevision.id}`));
    const diff = compareInventoryStates(beforeState, afterState);
    const total = diff.changed.length + diff.added.length + diff.removed.length + diff.categoriesAdded.length + diff.categoriesRemoved.length;
    if (!total) {
        container.appendChild(el('div', 'inventory-empty-state', 'No inventory differences between these revisions.'));
        return;
    }
    const summary = el('div', 'inventory-history-diff-summary', `${diff.changed.length} changed · ${diff.added.length} items added · ${diff.removed.length} items removed · ${diff.categoriesAdded.length} empty categories added · ${diff.categoriesRemoved.length} empty categories removed`);
    container.appendChild(summary);

    if (diff.changed.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Changed'));
        for (const change of diff.changed) {
            appendDiffEntry(
                container,
                `${change.after.category} · ${change.after.item.name}`,
                `${itemSummary(change.before)} → ${itemSummary(change.after)}`,
                'changed',
            );
        }
    }
    if (diff.added.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Added'));
        for (const entry of diff.added) appendDiffEntry(container, `${entry.category} · ${entry.item.name}`, `+ ${itemSummary(entry)}`, 'added');
    }
    if (diff.removed.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Removed'));
        for (const entry of diff.removed) appendDiffEntry(container, `${entry.category} · ${entry.item.name}`, `− ${itemSummary(entry)}`, 'removed');
    }
    if (diff.categoriesAdded.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Empty Categories Added'));
        for (const name of diff.categoriesAdded) appendDiffEntry(container, name, '+ empty category', 'added');
    }
    if (diff.categoriesRemoved.length) {
        container.appendChild(el('div', 'inventory-history-diff-heading', 'Empty Categories Removed'));
        for (const name of diff.categoriesRemoved) appendDiffEntry(container, name, '− empty category', 'removed');
    }
}

function renderRevisionSnapshot(container, revision, state) {
    container.replaceChildren();
    const date = revision.createdAt ? new Date(revision.createdAt).toLocaleString() : '';
    container.appendChild(el('div', 'inventory-history-inspector-title', `Revision ${revision.id} · ${revision.source}`));
    container.appendChild(el('div', 'inventory-history-meta', [revision.note, date].filter(Boolean).join(' · ')));
    const snapshot = el('div', 'inventory-history-snapshot');
    appendInventorySnapshot(snapshot, state);
    container.appendChild(snapshot);
}

function revisionSelect(revisions, selectedId) {
    const select = el('select', 'text_pole inventory-history-select');
    for (const revision of revisions) {
        const option = document.createElement('option');
        option.value = String(revision.id);
        option.textContent = `Revision ${revision.id} · ${revision.source}`;
        if (revision.id === selectedId) option.selected = true;
        select.appendChild(option);
    }
    return select;
}

export async function openInventoryHistory(context, revisions, activeRevision, { onRestore } = {}) {
    const root = el('div', 'inventory-history');
    let currentRevisions = [...revisions];
    let currentActiveRevision = activeRevision;

    const renderHistory = () => {
        root.replaceChildren();
        root.appendChild(el('div', 'inventory-history-intro', 'Backend revisions do not enter LLM context. View and Compare are read-only; Restore creates a new current revision.'));
        const backendRoot = ensureRoot(context);
        const revisionById = new Map(currentRevisions.map(revision => [revision.id, revision]));
        const stateFor = revision => getInventoryAt(backendRoot, revision.id);

        const inspector = el('div', 'inventory-history-inspector');
        const compareControls = el('div', 'inventory-history-compare-controls');
        const defaultRight = revisionById.has(currentActiveRevision) ? currentActiveRevision : currentRevisions[0]?.id;
        const defaultLeft = currentRevisions.find(revision => revision.id !== defaultRight)?.id ?? defaultRight;
        const fromSelect = revisionSelect(currentRevisions, defaultLeft);
        const toSelect = revisionSelect(currentRevisions, defaultRight);
        const compareButton = el('button', 'menu_button', 'Compare');
        compareButton.type = 'button';
        compareControls.append(el('span', '', 'Compare'), fromSelect, el('span', '', '→'), toSelect, compareButton);
        inspector.appendChild(compareControls);
        const inspectorOutput = el('div', 'inventory-history-inspector-output');
        inspector.appendChild(inspectorOutput);
        root.appendChild(inspector);

        const showComparison = (fromId, toId) => {
            const from = revisionById.get(Number(fromId));
            const to = revisionById.get(Number(toId));
            if (!from || !to) return;
            fromSelect.value = String(from.id);
            toSelect.value = String(to.id);
            renderComparison(inspectorOutput, from, to, stateFor(from), stateFor(to));
        };
        compareButton.addEventListener('click', () => showComparison(fromSelect.value, toSelect.value));

        const list = el('div', 'inventory-history-list');
        root.appendChild(list);
        if (!currentRevisions.length) list.appendChild(el('div', 'inventory-empty-state', 'No revisions.'));
        for (const revision of currentRevisions) {
            const row = el('div', `inventory-history-row${revision.id === currentActiveRevision ? ' active' : ''}`);
            const info = el('div', 'inventory-history-info');
            info.appendChild(el('div', 'inventory-history-title', `Revision ${revision.id} · ${revision.source}`));
            const date = revision.createdAt ? new Date(revision.createdAt).toLocaleString() : '';
            info.appendChild(el('div', 'inventory-history-meta', [revision.note, date].filter(Boolean).join(' · ')));
            row.appendChild(info);

            const actions = el('div', 'inventory-history-actions');
            const view = el('button', 'menu_button', 'View');
            view.type = 'button';
            view.addEventListener('click', () => renderRevisionSnapshot(inspectorOutput, revision, stateFor(revision)));
            actions.appendChild(view);

            const compare = el('button', 'menu_button', 'Compare');
            compare.type = 'button';
            compare.addEventListener('click', () => {
                const target = revision.id === currentActiveRevision
                    ? currentRevisions.find(candidate => candidate.id !== revision.id)?.id ?? revision.id
                    : currentActiveRevision;
                showComparison(revision.id, target);
            });
            actions.appendChild(compare);

            if (revision.id !== currentActiveRevision && onRestore) {
                const restore = el('button', 'menu_button', 'Restore');
                restore.type = 'button';
                restore.addEventListener('click', async () => {
                    try {
                        await onRestore(revision.id);
                        currentRevisions = listRevisions(context);
                        currentActiveRevision = ensureRoot(context).activeRevision;
                        renderHistory();
                        globalThis.toastr?.success(`Restored inventory revision ${revision.id}.`, 'Inventory Block');
                    } catch (error) { toastError(error); }
                });
                actions.appendChild(restore);
            }
            row.appendChild(actions);
            list.appendChild(row);
        }
        if (currentRevisions.length) {
            const active = revisionById.get(currentActiveRevision) ?? currentRevisions[0];
            renderRevisionSnapshot(inspectorOutput, active, stateFor(active));
        }
    };

    renderHistory();
    const popup = new context.Popup(root, context.POPUP_TYPE.TEXT, '', { okButton: 'Close', wide: true, large: true, allowVerticalScrolling: true });
    await popup.show();
}
