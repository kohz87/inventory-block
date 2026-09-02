import { HISTORY_RETENTION_OPTIONS, getHistoryRetention } from './constants.js';
import { applyHistoryRetention, clearInventoryHistory, trimInventoryHistory } from './history.js';

function activeContext() {
    return globalThis.SillyTavern?.getContext?.() ?? null;
}

function notify(level, message) {
    globalThis.toastr?.[level]?.(message, 'Inventory Block');
}

async function persistContext(context, { saveChat = false } = {}) {
    try {
        await context?.saveMetadata?.();
    } catch {
        context?.saveMetadataDebounced?.();
    }
    if (!saveChat) return;
    try {
        await context?.saveChat?.();
    } catch {
        context?.saveMetadataDebounced?.();
    }
}

export function settingsMarkup(version, retention = getHistoryRetention()) {
    const options = HISTORY_RETENTION_OPTIONS
        .map(value => `<option value="${value}"${value === Number(retention) ? ' selected' : ''}>${value}</option>`)
        .join('');
    return `
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Inventory Block</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="inventory-block-settings-version">v${version} · per-chat backend inventory</div>
                <div class="inventory-block-settings-actions">
                    <button id="inventory_block_settings_edit" type="button" class="menu_button">
                        <i class="fa-solid fa-pen-to-square"></i> Edit Inventory
                    </button>
                    <button id="inventory_block_settings_history" type="button" class="menu_button">
                        <i class="fa-solid fa-clock-rotate-left"></i> History
                    </button>
                    <button id="inventory_block_settings_copy" type="button" class="menu_button">
                        <i class="fa-solid fa-copy"></i> Copy Block
                    </button>
                </div>
                <div class="inventory-block-history-settings">
                    <label for="inventory_block_history_retention">History retention</label>
                    <select id="inventory_block_history_retention" class="text_pole">${options}</select>
                    <span>revisions</span>
                    <button id="inventory_block_history_trim" type="button" class="menu_button">Trim History Now</button>
                    <button id="inventory_block_history_clear" type="button" class="menu_button inventory-danger-button">Clear History</button>
                </div>
                <div class="inventory-block-settings-note">
                    Retention is an extension-wide cap. The active chat is trimmed immediately when this value changes; other chats use the cap when they are next opened or changed. Clear History preserves the current inventory while discarding its older restore/compare trail.
                </div>
            </div>
        </div>`;
}

export function addExtensionMenuButton(documentRef, { version, onEdit } = {}) {
    if (documentRef.querySelector('#inventory_block_menu')) return true;
    const menu = documentRef.querySelector('#extensionsMenu');
    if (!menu) return false;
    const item = documentRef.createElement('div');
    item.id = 'inventory_block_menu';
    item.className = 'list-group-item flex-container flexGap5';
    item.title = `Inventory Block v${version}`;
    item.innerHTML = '<div class="fa-solid fa-box-open extensionsMenuExtensionButton"></div><span>Inventory</span>';
    if (onEdit) item.addEventListener('click', onEdit);
    menu.appendChild(item);
    return true;
}

function wireHistorySettings(wrapper) {
    const retention = wrapper.querySelector('#inventory_block_history_retention');
    const trim = wrapper.querySelector('#inventory_block_history_trim');
    const clear = wrapper.querySelector('#inventory_block_history_clear');

    retention?.addEventListener('change', async () => {
        try {
            const context = activeContext();
            const result = applyHistoryRetention(context, retention.value);
            retention.value = String(result.retention);
            if (context?.chatMetadata) await persistContext(context);
            notify('success', context?.chatMetadata
                ? `History retention set to ${result.retention}; ${result.before - result.after} old revision${result.before - result.after === 1 ? '' : 's'} trimmed.`
                : `History retention set to ${result.retention}.`);
        } catch (error) {
            notify('error', error instanceof Error ? error.message : String(error));
        }
    });

    trim?.addEventListener('click', async () => {
        const context = activeContext();
        if (!context?.chatMetadata) return notify('warning', 'Open a chat before trimming inventory history.');
        try {
            const result = trimInventoryHistory(context);
            await persistContext(context);
            notify('success', `History trimmed: ${result.before} → ${result.after} revisions.`);
        } catch (error) {
            notify('error', error instanceof Error ? error.message : String(error));
        }
    });

    clear?.addEventListener('click', async () => {
        const context = activeContext();
        if (!context?.chatMetadata) return notify('warning', 'Open a chat before clearing inventory history.');
        const confirmed = typeof globalThis.confirm === 'function'
            ? globalThis.confirm('Clear Inventory Block history?\n\nThe current inventory will be preserved, but previous revisions will no longer be available for viewing, comparison, or restore.')
            : false;
        if (!confirmed) return;
        try {
            const result = clearInventoryHistory(context);
            await persistContext(context, { saveChat: true });
            notify('success', `Inventory history cleared. Current inventory preserved as the new baseline (${result.before} → ${result.after} revision).`);
        } catch (error) {
            notify('error', error instanceof Error ? error.message : String(error));
        }
    });
}

export function addExtensionSettingsPanel(documentRef, { version, onEdit, onHistory, onCopy } = {}) {
    if (documentRef.querySelector('#inventory_block_settings')) return true;
    const host = documentRef.querySelector('#extensions_settings') ?? documentRef.querySelector('#extensions_settings2');
    if (!host) return false;
    const wrapper = documentRef.createElement('div');
    wrapper.id = 'inventory_block_settings';
    wrapper.className = 'inventory-block-settings';
    wrapper.innerHTML = settingsMarkup(version);
    if (onEdit) wrapper.querySelector('#inventory_block_settings_edit')?.addEventListener('click', onEdit);
    if (onHistory) wrapper.querySelector('#inventory_block_settings_history')?.addEventListener('click', onHistory);
    if (onCopy) wrapper.querySelector('#inventory_block_settings_copy')?.addEventListener('click', onCopy);
    wireHistorySettings(wrapper);
    host.appendChild(wrapper);
    return true;
}

export function mountExtensionUi(documentRef, options = {}) {
    return {
        menuReady: addExtensionMenuButton(documentRef, options),
        settingsReady: addExtensionSettingsPanel(documentRef, options),
    };
}
