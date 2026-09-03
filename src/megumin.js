const TAB_KEY = 'inventory-block';
const BLOCK_ID = 'inventory';

let renderCurrent = null;
let mountedMessage = null;
let observer = null;
let observerRetry = null;
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

/**
 * Return Megumin's native card only after both of the attachment roots exist.
 * A partially rendered card is not yet a valid host.
 */
export function inventoryMeguminHost(messageElement) {
    const card = messageElement?.querySelector?.('.meg-blocks') ?? null;
    if (!card?.querySelector?.('.meg-blocks-tabs') || !card?.querySelector?.('.meg-blocks-panel')) return null;
    return card;
}

/**
 * Rendering may be skipped only when Inventory is already mounted in the host
 * mode that is available right now. A standalone mount must never block later
 * migration when Megumin finishes constructing its tab card.
 */
export function inventoryMountMatchesHost(messageElement) {
    const card = inventoryMeguminHost(messageElement);
    if (card) {
        return Boolean(card.querySelector?.('.inventory-block-tab') && card.querySelector?.('.inventory-block-pane'));
    }
    return Boolean(messageElement?.querySelector?.('.inventory-block-card'));
}

function removeInventoryFromMessage(messageElement) {
    messageElement?.querySelectorAll?.('.inventory-block-tab').forEach(node => node.remove());
    messageElement?.querySelectorAll?.('.inventory-block-pane').forEach(node => node.remove());
    messageElement?.querySelectorAll?.('.inventory-block-card').forEach(node => node.remove());
}

function cleanupPreviousMount(keep = null) {
    if (mountedMessage && mountedMessage !== keep && mountedMessage.isConnected) {
        removeInventoryFromMessage(mountedMessage);
    }
    mountedMessage = keep;
}

function makeTab() {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'meg-blocks-tab inventory-block-tab';
    tab.dataset.key = TAB_KEY;
    tab.dataset.blockId = BLOCK_ID;
    tab.title = 'Inventory';
    tab.setAttribute('aria-label', 'Inventory');
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

function deactivateInventory(card) {
    card.querySelector('.inventory-block-tab')?.classList.remove('active');
    const pane = card.querySelector('.inventory-block-pane');
    if (pane) pane.style.display = 'none';
}

function neutralizeMeguminSelection(card) {
    const active = card.querySelector('.meg-blocks-tab.active:not(.inventory-block-tab)');
    active?.click?.();
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
        const target = event.target?.closest?.('button');
        if (!target || !card.contains(target) || target.classList.contains('inventory-block-tab')) return;
        if (target.classList.contains('meg-blocks-tab') || target.classList.contains('meg-blocks-collapse')) {
            deactivateInventory(card);
        }
    }, true);
}

function attachMegumin(messageElement, readyCard = inventoryMeguminHost(messageElement)) {
    const card = readyCard;
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
            event.preventDefault();
            event.stopPropagation();
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

    renderCurrent?.(pane);
    return true;
}

function attachStandalone(messageElement) {
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
    if (pane) renderCurrent?.(pane);
    return true;
}

function mountNow() {
    if (suspended || !renderCurrent || !globalThis.SillyTavern?.getContext) return;
    hideRawInventoryElements();

    const ctx = context();
    const messageElement = latestAssistantElement(ctx);
    if (!messageElement) {
        cleanupPreviousMount(null);
        force = false;
        return;
    }

    const meguminCard = inventoryMeguminHost(messageElement);
    if (!force && mountedMessage === messageElement && inventoryMountMatchesHost(messageElement)) return;
    force = false;
    cleanupPreviousMount(messageElement);

    if (meguminCard) {
        messageElement.querySelector('.inventory-block-card')?.remove();
        attachMegumin(messageElement, meguminCard);
    } else {
        attachStandalone(messageElement);
    }
}

function ensureObserver() {
    const chat = document.querySelector('#chat');
    if (!chat) {
        if (!observerRetry) {
            observerRetry = setTimeout(() => {
                observerRetry = null;
                ensureObserver();
                scheduleInventoryMount(0, { forceRender: true });
            }, 250);
        }
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
    const next = Boolean(value);
    if (suspended === next) return;
    suspended = next;
    if (suspended) {
        if (timer) clearTimeout(timer);
        timer = null;
        return;
    }
    force = true;
    scheduleInventoryMount(0, { forceRender: true });
}

export function initializeMeguminBridge(renderer) {
    renderCurrent = renderer;
    ensureObserver();
    scheduleInventoryMount(0, { forceRender: true });
}
