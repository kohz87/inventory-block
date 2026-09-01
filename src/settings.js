export function settingsMarkup(version) {
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
                <div class="inventory-block-settings-note">
                    Inventory state is stored per chat and injected only for foreground assistant generations.
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
    host.appendChild(wrapper);
    return true;
}

export function mountExtensionUi(documentRef, options = {}) {
    return {
        menuReady: addExtensionMenuButton(documentRef, options),
        settingsReady: addExtensionSettingsPanel(documentRef, options),
    };
}
