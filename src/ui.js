import { normalizeInventory } from './state.js';
import { isRootCategoryName } from './protocol.js';

const clone = value => structuredClone(value);

function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
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

function textButton(icon, label, className = '') {
    const button = el('button', `inventory-text-button ${className}`.trim());
    button.type = 'button';
    button.innerHTML = `<i class="fa-solid ${icon}"></i><span>${label}</span>`;
    return button;
}

function itemCount(state) {
    return normalizeInventory(state).categories.reduce((sum, category) => sum + category.items.length, 0);
}

function displayQuantity(value) {
    const text = String(value ?? '').trim();
    if (!text) return '';
    return text.startsWith('×') ? text : `×${text}`;
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

export function renderInventoryPane(pane, state, { onEdit, onCopy, onHistory } = {}) {
    const inventory = normalizeInventory(state);
    const wasRendered = pane.dataset.inventoryRendered === '1';
    const openSections = new Set(
        Array.from(pane.querySelectorAll('details.inventory-category[open]'))
            .map(section => section.dataset.categoryName)
            .filter(Boolean),
    );

    pane.replaceChildren();
    pane.classList.add('inventory-block-pane');
    pane.dataset.inventoryRendered = '1';

    const rootCategories = inventory.categories.filter(category => isRootCategoryName(category.name));
    const sections = inventory.categories.filter(category => !isRootCategoryName(category.name));
    const totalItems = itemCount(inventory);

    const heading = el('div', 'inventory-ledger-heading');
    heading.appendChild(el('div', 'inventory-ledger-title', 'Inventory Ledger'));
    heading.appendChild(el('div', 'inventory-pane-summary', `${totalItems} item${totalItems === 1 ? '' : 's'} · ${sections.length} section${sections.length === 1 ? '' : 's'}`));
    pane.appendChild(heading);

    const toolbar = el('div', 'inventory-pane-toolbar');
    const primaryActions = el('div', 'inventory-pane-actions');

    if (onEdit) {
        const edit = textButton('fa-pen-to-square', 'Edit inventory');
        edit.addEventListener('click', event => {
            event.stopPropagation();
            onEdit();
        });
        primaryActions.appendChild(edit);
    }
    if (onCopy) {
        const copy = textButton('fa-copy', 'Copy block');
        copy.addEventListener('click', event => {
            event.stopPropagation();
            onCopy();
        });
        primaryActions.appendChild(copy);
    }
    toolbar.appendChild(primaryActions);

    if (onHistory) {
        const history = iconButton('fa-clock-rotate-left', 'Inventory history');
        history.addEventListener('click', event => {
            event.stopPropagation();
            onHistory();
        });
        toolbar.appendChild(history);
    }
    pane.appendChild(toolbar);

    if (!inventory.categories.length || totalItems === 0) {
        pane.appendChild(el('div', 'inventory-empty-state', 'Inventory is empty.'));
        return;
    }

    const rootItems = rootCategories.flatMap(category => category.items);
    if (rootItems.length) {
        const rootTable = el('div', 'inventory-table inventory-root-table');
        appendItemRows(rootTable, rootItems);
        pane.appendChild(rootTable);
    }

    sections.forEach((category, sectionIndex) => {
        const section = el('details', 'inventory-category');
        section.dataset.categoryName = category.name;
        section.open = wasRendered ? openSections.has(category.name) : sectionIndex === 0;

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

        const table = el('div', 'inventory-table');
        if (!category.items.length) {
            table.appendChild(el('div', 'inventory-category-empty', 'No items'));
        } else {
            appendItemRows(table, category.items);
        }

        section.appendChild(table);
        pane.appendChild(section);
    });
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

function isAffirmative(context, result) {
    return result === true || result === 1 || result === context.POPUP_RESULT?.AFFIRMATIVE;
}

export async function openInventoryEditor(context, currentState, { onSave } = {}) {
    let draft = normalizeInventory(clone(currentState));
    const root = el('div', 'inventory-editor');

    const toolbar = el('div', 'inventory-editor-toolbar');
    const addCategory = el('button', 'menu_button', 'Add Category');
    addCategory.type = 'button';
    const exportButton = el('button', 'menu_button', 'Export JSON');
    exportButton.type = 'button';
    const importButton = el('button', 'menu_button', 'Import JSON');
    importButton.type = 'button';
    const clearButton = el('button', 'menu_button', 'Clear');
    clearButton.type = 'button';
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
            removeCategory.addEventListener('click', () => {
                draft.categories.splice(categoryIndex, 1);
                renderDraft();
            });
            header.append(moveUp, moveDown, removeCategory);
            card.appendChild(header);

            const columnHeader = el('div', 'inventory-editor-row inventory-editor-header');
            columnHeader.appendChild(el('div', '', 'Name'));
            columnHeader.appendChild(el('div', '', 'Quantity'));
            columnHeader.appendChild(el('div', '', 'Remark'));
            columnHeader.appendChild(el('div'));
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
                remove.addEventListener('click', () => {
                    category.items.splice(itemIndex, 1);
                    renderDraft();
                });
                row.append(name, quantity, remark, remove);
                card.appendChild(row);
            });

            const addItem = el('button', 'menu_button inventory-add-item', 'Add Item');
            addItem.type = 'button';
            addItem.addEventListener('click', () => {
                category.items.push({ name: '', quantity: '1', remark: '' });
                renderDraft();
            });
            card.appendChild(addItem);
            list.appendChild(card);
        });
    }

    addCategory.addEventListener('click', () => {
        draft.categories.push({ name: `Category ${draft.categories.length + 1}`, items: [] });
        renderDraft();
    });

    exportButton.addEventListener('click', () => {
        downloadJson('inventory-block-v0.2.0.json', normalizeInventory(draft));
    });

    importButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                draft = normalizeInventory(JSON.parse(await file.text()));
                renderDraft();
            } catch (error) {
                globalThis.toastr?.error(error instanceof Error ? error.message : String(error), 'Inventory Block');
            }
        }, { once: true });
        input.click();
    });

    clearButton.addEventListener('click', () => {
        draft = { categories: [] };
        renderDraft();
    });

    renderDraft();

    const popup = new context.Popup(root, context.POPUP_TYPE.CONFIRM, '', {
        okButton: 'Save Inventory',
        cancelButton: 'Cancel',
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
    const result = await popup.show();
    if (!isAffirmative(context, result)) return false;

    const normalized = normalizeInventory(draft);
    if (onSave) await onSave(normalized);
    return true;
}

export async function openInventoryHistory(context, revisions, activeRevision, { onRestore } = {}) {
    const root = el('div', 'inventory-history');
    const intro = el('div', 'inventory-history-intro', 'Backend revisions do not enter the LLM context. Restoring creates a new current revision; it does not delete history.');
    root.appendChild(intro);

    const list = el('div', 'inventory-history-list');
    root.appendChild(list);

    if (!revisions.length) {
        list.appendChild(el('div', 'inventory-empty-state', 'No revisions.'));
    } else {
        for (const revision of revisions) {
            const row = el('div', `inventory-history-row${revision.id === activeRevision ? ' active' : ''}`);
            const info = el('div', 'inventory-history-info');
            const title = el('div', 'inventory-history-title', `Revision ${revision.id} · ${revision.source}`);
            const date = revision.createdAt ? new Date(revision.createdAt).toLocaleString() : '';
            const meta = el('div', 'inventory-history-meta', [revision.note, date].filter(Boolean).join(' · '));
            info.append(title, meta);
            row.appendChild(info);

            if (revision.id !== activeRevision && onRestore) {
                const restore = el('button', 'menu_button', 'Restore');
                restore.type = 'button';
                restore.addEventListener('click', async () => {
                    try {
                        await onRestore(revision.id);
                        globalThis.toastr?.success(`Restored inventory revision ${revision.id}.`, 'Inventory Block');
                    } catch (error) {
                        globalThis.toastr?.error(error instanceof Error ? error.message : String(error), 'Inventory Block');
                    }
                });
                row.appendChild(restore);
            }
            list.appendChild(row);
        }
    }

    const popup = new context.Popup(root, context.POPUP_TYPE.TEXT, '', {
        okButton: 'Close',
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
    await popup.show();
}
