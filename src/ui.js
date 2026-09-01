import { normalizeInventory } from './state.js';

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

function itemCount(state) {
    return normalizeInventory(state).categories.reduce((sum, category) => sum + category.items.length, 0);
}

export function renderInventoryPane(pane, state, { onEdit, onHistory } = {}) {
    const inventory = normalizeInventory(state);
    pane.replaceChildren();
    pane.classList.add('inventory-block-pane');

    const top = el('div', 'inventory-pane-toolbar');
    const summary = el('div', 'inventory-pane-summary', `${itemCount(inventory)} entr${itemCount(inventory) === 1 ? 'y' : 'ies'} · ${inventory.categories.length} categor${inventory.categories.length === 1 ? 'y' : 'ies'}`);
    top.appendChild(summary);

    const actions = el('div', 'inventory-pane-actions');
    if (onHistory) {
        const history = iconButton('fa-clock-rotate-left', 'Inventory history');
        history.addEventListener('click', event => {
            event.stopPropagation();
            onHistory();
        });
        actions.appendChild(history);
    }
    if (onEdit) {
        const edit = iconButton('fa-pen-to-square', 'Edit inventory');
        edit.addEventListener('click', event => {
            event.stopPropagation();
            onEdit();
        });
        actions.appendChild(edit);
    }
    top.appendChild(actions);
    pane.appendChild(top);

    if (!inventory.categories.length) {
        pane.appendChild(el('div', 'inventory-empty-state', 'Inventory is empty.'));
        return;
    }

    for (const category of inventory.categories) {
        const section = el('details', 'inventory-category');
        section.open = true;
        const heading = el('summary', 'inventory-category-title');
        heading.appendChild(el('span', 'inventory-category-name', category.name));
        heading.appendChild(el('span', 'inventory-category-count', String(category.items.length)));
        section.appendChild(heading);

        const table = el('div', 'inventory-table');
        const header = el('div', 'inventory-row inventory-header-row');
        header.appendChild(el('div', 'inventory-cell inventory-name', 'Name'));
        header.appendChild(el('div', 'inventory-cell inventory-quantity', 'Quantity'));
        header.appendChild(el('div', 'inventory-cell inventory-remark', 'Remark'));
        table.appendChild(header);

        if (!category.items.length) {
            table.appendChild(el('div', 'inventory-category-empty', 'No items'));
        } else {
            for (const item of category.items) {
                const row = el('div', 'inventory-row');
                row.appendChild(el('div', 'inventory-cell inventory-name', item.name));
                row.appendChild(el('div', 'inventory-cell inventory-quantity', item.quantity));
                row.appendChild(el('div', 'inventory-cell inventory-remark', item.remark));
                table.appendChild(row);
            }
        }

        section.appendChild(table);
        pane.appendChild(section);
    }
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
