const TAB_KEY = 'inventory-block';
const BLOCK_ID = 'inventory';

let observer = null;
let timer = null;
let observerRetry = null;
let renderCurrent = null;
let mountedMessageElement = null;
let mountSuspended = false;
let forceRender = false;

function latestAssistantMessageElement(context) {
    const messages = Array.from(document.querySelectorAll('#chat .mes')).reverse();
    return messages.find(element => {
        const index = Number.parseInt(element.getAttribute('mesid'), 10);
        const message = Number.isInteger(index) ? context?.chat?.[index] : null;
        return message && !message.is_user && !message.is_system;
    }) ?? null;
}

function removeInventoryFromMessage(messageElement) {
    messageElement.querySelectorAll('.inventory-block-tab').forEach(node => node.remove());
    messageElement.querySelectorAll('.inventory-block-pane').forEach(node => node.remove());
    messageElement.querySelectorAll('.inventory-block-card').forEach(node => node.remove());
}

function cleanupPreviousMount(keep = null) {
    if (mountedMessageElement && mountedMessageElement !== keep && mountedMessageElement.isConnected) {
        removeInventoryFromMessage(mountedMessageElement);
    }
    mountedMessageElement = keep;
}

function makeTab() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'meg-blocks-tab inventory-block-tab';
    button.dataset.key = TAB_KEY;
    button.dataset.blockId = BLOCK_ID;
    button.title = 'Inventory';
    button.setAttribute('aria-label', 'Inventory');
    button.innerHTML = '<span class="meg-blocks-tab-emoji">🎒</span><span class="meg-blocks-tab-label">Inventory</span>';
    return button;
}

function makePane() {
    const pane = document.createElement('div');
    pane.className = 'meg-block-body inventory-block-pane';
    pane.dataset.key = TAB_KEY;
    pane.dataset.blockId = BLOCK_ID;
    pane.style.display = 'none';
    return pane;
}

function deactivateInventory(card) {
    card.querySelector('.inventory-block-tab')?.classList.remove('active');
    const pane = card.querySelector('.inventory-block-pane');
    if (pane) pane.style.display = 'none';
}

function neutralizeMeguminSelection(card) {
    const active = card.querySelector('.meg-blocks-tab.active:not(.inventory-block-tab)');
    if (active instanceof HTMLButtonElement) active.click();
}

function activateInventory(card) {
    neutralizeMeguminSelection(card);
    card.querySelectorAll('.meg-blocks-tab.active').forEach(tab => tab.classList.remove('active'));
    card.querySelectorAll('.meg-block-body').forEach(pane => { pane.style.display = 'none'; });
    card.querySelector('.inventory-block-tab')?.classList.add('active');
    const pane = card.querySelector('.inventory-block-pane');
    if (pane) pane.style.display = '';
    card.classList.remove('meg-blocks-shut');
}

function bindExistingCard(card) {
    if (card.dataset.inventoryBlockBound === '1') return;
    card.dataset.inventoryBlockBound = '1';
    card.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target.closest('button') : null;
        if (!target || !card.contains(target) || target.classList.contains('inventory-block-tab')) return;
        if (target.classList.contains('meg-blocks-tab') || target.classList.contains('meg-blocks-collapse')) deactivateInventory(card);
    }, true);
}

function attachToMeguminCard(messageElement, renderPane) {
    const card = messageElement.querySelector('.meg-blocks');
    if (!card) return false;
    bindExistingCard(card);
    const tabs = card.querySelector('.meg-blocks-tabs');
    const panel = card.querySelector('.meg-blocks-panel');
    if (!tabs || !panel) return false;

    let tab = card.querySelector('.inventory-block-tab');
    let pane = card.querySelector('.inventory-block-pane');
    if (!tab) {
        tab = makeTab();
        const collapse = tabs.querySelector('.meg-blocks-collapse');
        if (collapse) tabs.insertBefore(tab, collapse);
        else tabs.appendChild(tab);
        tab.addEventListener('click', event => {
            event.stopPropagation();
            event.preventDefault();
            const isOpen = tab.classList.contains('active') && pane?.style.display !== 'none';
            if (isOpen) {
                deactivateInventory(card);
                card.classList.add('meg-blocks-shut');
            } else {
                activateInventory(card);
            }
        });
    }
    if (!pane) {
        pane = makePane();
        panel.appendChild(pane);
    }
    renderPane(pane);
    return true;
}

function attachStandalone(messageElement, renderPane) {
    const body = messageElement.querySelector('.mes_text');
    if (!body) return false;
    let card = body.querySelector(':scope > .inventory-block-card');
    if (!card) {
        card = document.createElement('div');
        card.className = 'inventory-block-card inventory-block-standalone';
        card.innerHTML = `
            <div class="meg-blocks-tabs">
                <button type="button" class="meg-blocks-tab inventory-block-tab active" data-key="${TAB_KEY}" data-block-id="${BLOCK_ID}" aria-label="Inventory" title="Inventory">
                    <span class="meg-blocks-tab-emoji">🎒</span><span class="meg-blocks-tab-label">Inventory</span>
                </button>
                <button type="button" class="meg-blocks-collapse" title="Fold"><i class="fa-solid fa-chevron-down"></i></button>
            </div>
            <div class="meg-blocks-panel"><div class="meg-block-body inventory-block-pane" data-key="${TAB_KEY}" data-block-id="${BLOCK_ID}"></div></div>`;
        body.appendChild(card);
        const tab = card.querySelector('.inventory-block-tab');
        const pane = card.querySelector('.inventory-block-pane');
        const toggle = event => {
            event.stopPropagation();
            if (!pane || !tab) return;
            const open = pane.style.display !== 'none';
            pane.style.display = open ? 'none' : '';
            tab.classList.toggle('active', !open);
            card.classList.toggle('meg-blocks-shut', open);
        };
        tab?.addEventListener('click', toggle);
        card.querySelector('.meg-blocks-collapse')?.addEventListener('click', toggle);
    }
    const pane = card.querySelector('.inventory-block-pane');
    if (pane) renderPane(pane);
    return true;
}

function mountNow() {
    if (!renderCurrent || !globalThis.SillyTavern?.getContext || mountSuspended) return;
    const context = SillyTavern.getContext();
    const messageElement = latestAssistantMessageElement(context);
    if (!messageElement) {
        cleanupPreviousMount(null);
        forceRender = false;
        return;
    }

    const hasExistingMount = Boolean(messageElement.querySelector('.inventory-block-pane, .inventory-block-card'));
    if (!forceRender && mountedMessageElement === messageElement && hasExistingMount) return;
    forceRender = false;
    cleanupPreviousMount(messageElement);

    const meguminCard = messageElement.querySelector('.meg-blocks');
    if (meguminCard) {
        messageElement.querySelector('.inventory-block-card')?.remove();
        attachToMeguminCard(messageElement, renderCurrent);
    } else {
        attachStandalone(messageElement, renderCurrent);
    }
}

function ensureObserver() {
    const chat = document.querySelector('#chat');
    if (!chat) {
        if (!observerRetry) observerRetry = setTimeout(() => { observerRetry = null; ensureObserver(); scheduleInventoryMount(0); }, 250);
        return;
    }
    if (observer?.__inventoryChat === chat) return;
    observer?.disconnect();
    observer = new MutationObserver(mutations => {
        const relevant = mutations.some(mutation => {
            const target = mutation.target instanceof Element ? mutation.target : mutation.target?.parentElement;
            if (!target) return true;
            if (target.closest('.inventory-block-pane') || target.closest('.inventory-block-card')) return false;
            return true;
        });
        if (relevant) scheduleInventoryMount(60);
    });
    observer.__inventoryChat = chat;
    observer.observe(chat, { childList: true, subtree: true });
}

export function scheduleInventoryMount(delay = 60, { force = false } = {}) {
    ensureObserver();
    if (force) forceRender = true;
    if (mountSuspended) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        mountNow();
    }, delay);
}

export function setInventoryMountSuspended(value) {
    const next = Boolean(value);
    if (mountSuspended === next) return;
    mountSuspended = next;
    if (mountSuspended) {
        if (timer) clearTimeout(timer);
        timer = null;
        return;
    }
    forceRender = true;
    scheduleInventoryMount(0, { force: true });
}

export function initializeMeguminBridge(renderPane) {
    renderCurrent = renderPane;
    ensureObserver();
    scheduleInventoryMount(0, { force: true });
}
