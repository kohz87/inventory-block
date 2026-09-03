import { emptyInventory, formatInventoryBlock, normalizeInventory, parseInventoryBlock } from './snapshot.js';

const sectionStateByKey = new Map();

function el(tag, className = '', text = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function itemCount(state) {
    return normalizeInventory(state).categories.reduce((sum, category) => sum + category.items.length, 0);
}

function sectionState(uiKey) {
    const key = String(uiKey ?? 'default');
    if (!sectionStateByKey.has(key)) sectionStateByKey.set(key, { initialized: false, open: new Set() });
    return sectionStateByKey.get(key);
}

export function renderInventoryPane(pane, state, { onEdit, onCopy, hasSnapshot = true, uiKey = 'default' } = {}) {
    const inventory = normalizeInventory(state ?? emptyInventory());
    const remembered = sectionState(uiKey);
    pane.replaceChildren();
    pane.classList.add('inventory-block-pane');

    const head = el('div', 'inventory-ledger-heading');
    head.append(el('div', 'inventory-ledger-title', 'Inventory'));
    head.append(el('div', 'inventory-pane-summary', hasSnapshot ? `${itemCount(inventory)} items` : 'No snapshot yet'));
    pane.appendChild(head);

    const toolbar = el('div', 'inventory-pane-toolbar');
    if (onEdit) {
        const button = el('button', 'menu_button inventory-action', 'Edit Inventory');
        button.type = 'button';
        button.addEventListener('click', event => { event.stopPropagation(); onEdit(); });
        toolbar.appendChild(button);
    }
    if (onCopy) {
        const button = el('button', 'menu_button inventory-action', 'Copy Block');
        button.type = 'button';
        button.addEventListener('click', event => { event.stopPropagation(); onCopy(); });
        toolbar.appendChild(button);
    }
    pane.appendChild(toolbar);

    if (!hasSnapshot) {
        pane.appendChild(el('div', 'inventory-empty-state', 'No valid <Inventory> snapshot exists in this chat yet.'));
        return;
    }
    if (!inventory.categories.length || itemCount(inventory) === 0) {
        pane.appendChild(el('div', 'inventory-empty-state', 'Inventory is empty.'));
        return;
    }

    inventory.categories.forEach((category, index) => {
        const section = el('details', 'inventory-category');
        const categoryKey = category.name.normalize('NFKC').toLowerCase();
        section.open = remembered.open.has(categoryKey) || (!remembered.initialized && index === 0);
        if (section.open) remembered.open.add(categoryKey);

        const summary = el('summary', 'inventory-category-title');
        summary.appendChild(el('span', 'inventory-category-name', category.name));
        summary.appendChild(el('span', 'inventory-category-count', `${category.items.length} ${category.items.length === 1 ? 'item' : 'items'}`));
        section.appendChild(summary);

        section.addEventListener('toggle', () => {
            if (section.open) remembered.open.add(categoryKey);
            else remembered.open.delete(categoryKey);
        });

        const table = el('div', 'inventory-table');
        for (const item of category.items) {
            const row = el('div', 'inventory-row');
            row.append(
                el('div', 'inventory-cell inventory-name', item.name),
                el('div', 'inventory-cell inventory-quantity', item.quantity ? `×${item.quantity}` : ''),
                el('div', 'inventory-cell inventory-remark', item.remark),
            );
            table.appendChild(row);
        }
        if (!category.items.length) table.appendChild(el('div', 'inventory-empty-state', 'No items'));
        section.appendChild(table);
        pane.appendChild(section);
    });
    remembered.initialized = true;
}

function toastError(error) {
    globalThis.toastr?.error(error instanceof Error ? error.message : String(error), 'Inventory Block');
}

export async function openInventoryEditor(context, state, { onSave } = {}) {
    const root = el('div', 'inventory-editor');
    root.appendChild(el('div', 'inventory-editor-note', 'This edits the current full message-native <Inventory> snapshot. No hidden backend state is involved.'));
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
