const TAB_KEY = 'inventory-block';
const BLOCK_ID = 'inventory';

let renderCurrent = null;
let mountedMessage = null;
let observer = null;
let timer = null;
let suspended = false;
let force = false;

function context() {
    return globalThis.SillyTavern?.getContext?.() ?? null;
}

function latestAssistantElement(ctx) {
    const elements = Array.from(document.querySelectorAll('#chat .mes')).reverse();
    return elements.find(element => {
        const id = Number.parseInt(element.getAttribute('mesid') ?? '', 10);
        const message = Number.isInteger(id) ? ctx?.chat?.[id] : null;
        return message && !message.is_user && !message.is_system;
    }) ?? null;
}

function hideRawInventoryElements() {
    document.querySelectorAll('#chat .mes_text inventory').forEach(node => {
        if (node instanceof HTMLElement) node.style.display = 'none';
    });
}

function meguminHost(messageElement) {
    const card = messageElement?.querySelector?.('.meg-blocks') ?? null;
    return card?.querySelector?.('.meg-blocks-tabs') && card?.querySelector?.('.meg-blocks-panel') ? card : null;
}

function removeOldMount(messageElement) {
    messageElement?.querySelectorAll?.('.inventory-block-tab,.inventory-block-pane,.inventory-block-card').forEach(node => node.remove());
}

function makeTab() {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'meg-blocks-tab inventory-block-tab';
    tab.dataset.key = TAB_KEY;
    tab.dataset.blockId = BLOCK_ID;
    tab.innerHTML = '<span class="meg-blocks-tab-emoji">🎒</span><span class="meg-blocks-tab-label">Inventory</span>';
    return tab;
}

function makePane() {
    const pane = document.createElement('div');
    pane.className = 'meg-block-body inventory-block-pane';
    pane.dataset.key = TAB_KEY;
    pane.dataset.blockId = BLOCK_ID;
    pane.style.display = 'none';
    return pane;
}

function attachMegumin(messageElement, card) {
    const tabs = card.querySelector('.meg-blocks-tabs');
    const panel = card.querySelector('.meg-blocks-panel');
    if (!tabs || !panel) return false;
    let tab = card.querySelector('.inventory-block-tab');
    let pane = card.querySelector('.inventory-block-pane');
    if (!tab) {
        tab = makeTab();
        tabs.insertBefore(tab, tabs.querySelector('.meg-blocks-collapse'));
    }
    if (!pane) {
        pane = makePane();
        panel.appendChild(pane);
    }
    if (tab.dataset.inventoryBound !== '1') {
        tab.dataset.inventoryBound = '1';
        tab.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const opening = pane.style.display === 'none';
            card.querySelectorAll('.meg-blocks-tab.active').forEach(node => node.classList.remove('active'));
            card.querySelectorAll('.meg-block-body').forEach(node => { node.style.display = 'none'; });
            if (opening) {
                tab.classList.add('active');
                pane.style.display = '';
                card.classList.remove('meg-blocks-shut');
            }
        });
    }
    renderCurrent?.(pane);
    return true;
}

function attachStandalone(messageElement) {
    const body = messageElement.querySelector('.mes_text');
    if (!body) return false;
    let card = body.querySelector(':scope > .inventory-block-card');
    if (!card) {
        card = document.createElement('div');
        card.className = 'inventory-block-card';
        card.innerHTML = '<div class="inventory-block-card-head">🎒 Inventory</div><div class="inventory-block-pane"></div>';
        body.appendChild(card);
    }
    const pane = card.querySelector('.inventory-block-pane');
    if (pane) renderCurrent?.(pane);
    return true;
}

function mountNow() {
    if (suspended || !renderCurrent) return;
    hideRawInventoryElements();
    const ctx = context();
    const messageElement = latestAssistantElement(ctx);
    if (!messageElement) {
        if (mountedMessage?.isConnected) removeOldMount(mountedMessage);
        mountedMessage = null;
        return;
    }
    if (!force && mountedMessage === messageElement && messageElement.querySelector('.inventory-block-pane')) return;
    force = false;
    if (mountedMessage && mountedMessage !== messageElement && mountedMessage.isConnected) removeOldMount(mountedMessage);
    mountedMessage = messageElement;
    const host = meguminHost(messageElement);
    if (host) {
        messageElement.querySelector('.inventory-block-card')?.remove();
        attachMegumin(messageElement, host);
    } else {
        attachStandalone(messageElement);
    }
}

function ensureObserver() {
    const chat = document.querySelector('#chat');
    if (!chat || observer?.__inventoryChat === chat) return;
    observer?.disconnect();
    observer = new MutationObserver(mutations => {
        const relevant = mutations.some(mutation => {
            const target = mutation.target instanceof Element ? mutation.target : mutation.target?.parentElement;
            return !target?.closest?.('.inventory-block-pane,.inventory-block-card');
        });
        if (relevant) scheduleInventoryMount(60);
    });
    observer.__inventoryChat = chat;
    observer.observe(chat, { childList: true, subtree: true });
}

export function scheduleInventoryMount(delay = 30, { forceRender = false } = {}) {
    ensureObserver();
    if (forceRender) force = true;
    if (suspended) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        mountNow();
    }, delay);
}

export function setInventoryMountSuspended(value) {
    suspended = Boolean(value);
    if (!suspended) scheduleInventoryMount(0, { forceRender: true });
}

export function initializeMeguminBridge(renderer) {
    renderCurrent = renderer;
    ensureObserver();
    scheduleInventoryMount(0, { forceRender: true });
}
