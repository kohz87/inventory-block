from pathlib import Path

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text()

def write(path, text):
    (ROOT / path).write_text(text)

def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)

for path in ['src/constants.js','manifest.json','package.json','style.css','README.md']:
    text = read(path).replace('0.3.4', '0.3.5')
    write(path, text)

path = 'src/settings.js'
text = read(path)
text = once(text,
'''                    <button id="inventory_block_settings_copy" type="button" class="menu_button">\n                        <i class="fa-solid fa-copy"></i> Copy Block\n                    </button>\n''',
'''                    <button id="inventory_block_settings_copy" type="button" class="menu_button">\n                        <i class="fa-solid fa-copy"></i> Copy Block\n                    </button>\n                    <button id="inventory_block_settings_reconcile" type="button" class="menu_button">\n                        <i class="fa-solid fa-rotate"></i> Reconcile Latest Response\n                    </button>\n''', 'settings button')
text = text.replace(
"export function addExtensionSettingsPanel(documentRef, { version, onEdit, onHistory, onCopy } = {}) {",
"export function addExtensionSettingsPanel(documentRef, { version, onEdit, onHistory, onCopy, onReconcile } = {}) {")
text = once(text,
'''    if (onCopy) wrapper.querySelector('#inventory_block_settings_copy')?.addEventListener('click', onCopy);\n    wireHistorySettings(wrapper);\n''',
'''    if (onCopy) wrapper.querySelector('#inventory_block_settings_copy')?.addEventListener('click', onCopy);\n    if (onReconcile) {\n        const reconcile = wrapper.querySelector('#inventory_block_settings_reconcile');\n        reconcile?.addEventListener('click', async () => {\n            if (reconcile.disabled) return;\n            const original = reconcile.innerHTML;\n            reconcile.disabled = true;\n            reconcile.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reconciling…';\n            try { await onReconcile(); }\n            finally {\n                reconcile.disabled = false;\n                reconcile.innerHTML = original;\n            }\n        });\n    }\n    wireHistorySettings(wrapper);\n''', 'settings reconcile wiring')
write(path, text)

path = 'index.js'
text = read(path)
text = once(text,
'''let rawReconciliationActive = 0;\nconst terminalCleanupTimers = new Map();\n''',
'''let rawReconciliationActive = 0;\nlet slashCommandsRegistered = false;\nconst terminalCleanupTimers = new Map();\n''', 'slash state')
text = once(text,
'''function activeMessageMeta(message) {\n    return message?.extra?.[EXTRA_KEY] ?? null;\n}\n\nfunction generationBase(ctx, session = null) {\n''',
'''function activeMessageMeta(message) {\n    return message?.extra?.[EXTRA_KEY] ?? null;\n}\n\nfunction reconciliationTextHash(text) {\n    let hash = 2166136261;\n    const source = String(text ?? '');\n    for (let i = 0; i < source.length; i++) {\n        hash ^= source.charCodeAt(i);\n        hash = Math.imul(hash, 16777619);\n    }\n    return (hash >>> 0).toString(36);\n}\n\nfunction reconciliationStampMatches(message, stamp = activeMessageMeta(message)?.reconcile) {\n    const text = String(message?.mes ?? '');\n    return Boolean(stamp && Number.isInteger(stamp.textLength) && stamp.textLength === text.length && stamp.textHash === reconciliationTextHash(text));\n}\n\nfunction stampReconciliation(context, messageId, revisionId) {\n    const message = context?.chat?.[messageId];\n    if (!message) return null;\n    message.extra ??= {};\n    const current = message.extra[EXTRA_KEY] ?? {};\n    message.extra[EXTRA_KEY] = {\n        ...current,\n        reconcile: {\n            version: 1,\n            textLength: String(message.mes ?? '').length,\n            textHash: reconciliationTextHash(message.mes),\n            revision: revisionId,\n            at: Date.now(),\n        },\n    };\n    return message.extra[EXTRA_KEY].reconcile;\n}\n\nfunction latestUserTextBefore(ctx, messageId) {\n    for (let i = Number(messageId) - 1; i >= 0; i--) {\n        const message = ctx?.chat?.[i];\n        if (message?.is_user && !message.is_system) return String(message.mes ?? '');\n    }\n    return '';\n}\n\nfunction generationBase(ctx, session = null) {\n''', 'reconciliation stamp helpers')
text = once(text,
'''        attachReconciledRevision(live, session, message, id, acceptedRevision, baseRevision);\n        liveRoot.activeRevision = acceptedRevision;\n''',
'''        attachReconciledRevision(live, session, message, id, acceptedRevision, baseRevision);\n        if (!warnings.length) stampReconciliation(live, id, acceptedRevision);\n        liveRoot.activeRevision = acceptedRevision;\n''', 'automatic reconciliation stamp')

insert_before = "function maybeStartReconciliation(session, { messageReceivedIsFinal = false } = {}) {"
manual_code = r'''async function reconcileLatestResponse({ notifyResult = true } = {}) {
    const ctx = context();
    if (!ctx || !hasActiveChat(ctx)) throw new Error('Open a chat before reconciling inventory.');
    if (generationLockFor(ctx)) throw new Error('Wait for the current generation response to finish before reconciling inventory manually.');
    if (rawReconciliationActive > 0) throw new Error('Inventory reconciliation is already running.');

    const id = latestAssistantMessageId(ctx);
    const message = ctx.chat?.[id];
    if (!Number.isInteger(id) || !message || message.is_user || message.is_system) throw new Error('No completed assistant response is available to reconcile.');

    invalidateLineageCache(ctx);
    const root = ensureRoot(ctx);
    const currentRevision = resolveActiveRevision(ctx);
    const meta = activeMessageMeta(message);
    const stamp = meta?.reconcile;
    const text = String(message.mes ?? '');

    if (reconciliationStampMatches(message, stamp)) {
        if (notifyResult) notify('info', 'This response has already been reconciled.');
        return 'already-reconciled';
    }

    let eventText = text;
    let baseRevision = currentRevision;
    if (stamp && Number.isInteger(stamp.textLength) && stamp.textLength >= 0 && stamp.textLength < text.length) {
        const prefix = text.slice(0, stamp.textLength);
        if (reconciliationTextHash(prefix) !== stamp.textHash) throw new Error('The latest response changed before its previous reconciliation boundary. Manual reconciliation was refused to avoid double-counting.');
        if (!Number.isInteger(stamp.revision) || !getRevision(root, stamp.revision) || currentRevision !== stamp.revision) throw new Error('Inventory changed after the last reconciliation. Manual suffix reconciliation was refused to avoid applying the response against stale state.');
        eventText = text.slice(stamp.textLength);
        baseRevision = stamp.revision;
        if (!eventText.trim()) {
            if (notifyResult) notify('info', 'This response has already been reconciled.');
            return 'already-reconciled';
        }
    } else if (!stamp && meta && Number.isInteger(meta.baseRevision) && Number.isInteger(meta.revision) && meta.revision !== meta.baseRevision) {
        throw new Error('This legacy response already carries an Inventory state change but has no v0.3.5 reconciliation stamp. Manual retry was refused to avoid double-counting it.');
    }

    const mutationSerial = root.mutationSerial;
    const lineageHash = lineageHashThrough(ctx, id);
    const baseState = getInventoryAt(root, baseRevision);
    const generateRaw = ctx.generateRaw;
    if (typeof generateRaw !== 'function') throw new Error('SillyTavern generateRaw is unavailable; manual inventory reconciliation cannot run.');

    const reconciliationPrompt = buildReconciliationPrompt(baseState, {
        userText: latestUserTextBefore(ctx, id),
        assistantText: eventText,
        type: stamp ? 'continue' : 'manual_reconcile',
        replaceCapability: null,
    });

    let reply;
    rawReconciliationActive += 1;
    try {
        reply = await generateRaw({ prompt: reconciliationPrompt });
    } finally {
        rawReconciliationActive = Math.max(0, rawReconciliationActive - 1);
    }

    const live = context();
    if (!live || chatIdOf(live) !== chatIdOf(ctx)) throw new Error('The active chat changed while manual inventory reconciliation was running. Its result was discarded.');
    invalidateLineageCache(live);
    const liveRoot = ensureRoot(live);
    if (liveRoot.mutationSerial !== mutationSerial || lineageHashThrough(live, id) !== lineageHash) throw new Error('Inventory or chat history changed while manual reconciliation was running. Its result was discarded.');

    const result = parseReconciliationReply(reply, baseState, { replaceCapability: null });
    if (result.errors.length) throw new Error(result.errors.join(' '));

    let acceptedRevision = baseRevision;
    if (!inventoryEquals(baseState, result.state)) {
        acceptedRevision = createRevision(live, result.state, {
            parent: baseRevision,
            source: SOURCE.LLM,
            note: result.note || 'Manual post-response inventory reconciliation',
        });
    } else {
        liveRoot.activeRevision = baseRevision;
    }

    const pseudoSession = { chatId: chatIdOf(live), type: stamp ? 'continue' : 'manual_reconcile' };
    attachReconciledRevision(live, pseudoSession, message, id, acceptedRevision, baseRevision);
    stampReconciliation(live, id, acceptedRevision);
    liveRoot.activeRevision = acceptedRevision;
    rememberBranchHead(live, acceptedRevision);
    persistChatSoon(live, chatIdOf(live));
    refreshAll();
    if (notifyResult) notify('success', inventoryEquals(baseState, result.state) ? 'Latest response reconciled; no inventory change was needed.' : 'Latest response reconciled and inventory updated.');
    return inventoryEquals(baseState, result.state) ? 'no-change' : 'updated';
}

function registerSlashCommands() {
    if (slashCommandsRegistered) return;
    const ctx = context();
    const Parser = ctx?.SlashCommandParser;
    const Command = ctx?.SlashCommand;
    if (!Parser?.addCommandObject || !Command?.fromProps) return;
    try {
        Parser.addCommandObject(Command.fromProps({
            name: 'inventory-reconcile',
            aliases: ['inv-reconcile'],
            callback: async () => {
                try { return await reconcileLatestResponse({ notifyResult: true }); }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    notify('error', message);
                    return `error: ${message}`;
                }
            },
            returns: 'inventory reconciliation status',
            helpString: '<div>Retries Inventory Block reconciliation for the latest completed assistant response. Already reconciled text is never scanned twice.</div>',
        }));
        slashCommandsRegistered = true;
    } catch (error) {
        console.warn('[Inventory Block] Could not register /inventory-reconcile.', error);
    }
}

'''
text = once(text, insert_before, manual_code + insert_before, 'manual reconcile function')
text = once(text,
'''        onHistory: openHistory,\n        onCopy: copyInventoryBlock,\n    });\n''',
'''        onHistory: openHistory,\n        onCopy: copyInventoryBlock,\n        onReconcile: async () => {\n            try { await reconcileLatestResponse({ notifyResult: true }); }\n            catch (error) { notify('error', error instanceof Error ? error.message : String(error)); }\n        },\n    });\n''', 'settings callback')
text = once(text,
'''    initializeMeguminBridge(renderCurrentPane);\n    registerEvents();\n    await resolveBranchAndRefresh();\n''',
'''    initializeMeguminBridge(renderCurrentPane);\n    registerEvents();\n    registerSlashCommands();\n    await resolveBranchAndRefresh();\n''', 'slash init')
write(path, text)

path = 'CHANGELOG.md'
text = read(path)
entry = '''## 0.3.5\n\n- Added **Reconcile Latest Response** under Extensions → Inventory Block for manual recovery after a failed post-response API scan.\n- Added `/inventory-reconcile` (alias `/inv-reconcile`) for the same safe manual retry path.\n- Successful reconciliations now stamp the exact assistant text/revision, preventing duplicate charges and allowing future Continue suffixes to be reconciled without rescanning older events.\n- Manual reconciliation fails closed if chat/inventory state changes while the raw scan is running or if a legacy changed response cannot be proven safe to rescan.\n- The UI disables the manual button and shows `Reconciling…` while a retry is active.\n\n'''
if '## 0.3.5' not in text:
    marker = '## 0.3.4'
    if marker not in text: raise SystemExit('changelog marker missing')
    text = text.replace(marker, entry + marker, 1)
write(path, text)

path = 'README.md'
text = read(path)
needle = 'The same controls plus retention/cleanup settings are available under **Extensions → Inventory Block**. No search, encumbrance, rarity, equipment-slot, or other heavyweight subsystem is added.'
replacement = 'The same controls plus retention/cleanup settings are available under **Extensions → Inventory Block**. v0.3.5 also adds **Reconcile Latest Response** for retrying a failed post-response scan; already-reconciled text is stamped and will not be charged twice. The same recovery action is available as `/inventory-reconcile` (alias `/inv-reconcile`). No search, encumbrance, rarity, equipment-slot, or other heavyweight subsystem is added.'
text = once(text, needle, replacement, 'README manual reconcile docs')
write(path, text)

path = 'TEST-REPORT.md'
text = read(path)
text = text.replace('# Inventory Block v0.3.4', '# Inventory Block v0.3.5', 1) if '# Inventory Block v0.3.4' in text else text.replace('# Inventory Block v0.3.3', '# Inventory Block v0.3.5', 1)
if '## v0.3.5 manual reconciliation recovery' not in text:
    marker = '\n## v0.3.4'
    insert = '\n## v0.3.5 manual reconciliation recovery\n\nv0.3.5 adds a guarded manual retry for the latest completed assistant response through both the settings UI and `/inventory-reconcile`. Reconciliation stamps bind successful scans to exact assistant text and revision state so repeated clicks cannot double-charge resources; later Continue suffixes can be scanned without replaying older events.\n'
    if marker in text: text = text.replace(marker, insert + marker, 1)
    else: text = text.replace('\n## v0.3.3', insert + '\n## v0.3.3', 1)
write(path, text)

for path in ['tests/release.test.js','tests/integration-static.test.js']:
    text = read(path).replace('0.3.4', '0.3.5')
    write(path, text)

path = 'tests/settings-ui.test.js'
text = read(path)
if 'settings expose manual latest-response reconciliation' not in text:
    text += '''\n\ntest('settings expose manual latest-response reconciliation', () => {\n  const source = fs.readFileSync(new URL('../src/settings.js', import.meta.url), 'utf8');\n  assert.match(source, /inventory_block_settings_reconcile/);\n  assert.match(source, /Reconcile Latest Response/);\n  assert.match(source, /onReconcile/);\n  assert.match(source, /Reconciling…/);\n});\n'''
write(path, text)

write('tests/v035-manual-reconcile.test.js', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../src/settings.js', import.meta.url), 'utf8');

test('manual reconciliation action and slash command are present', () => {
  assert.match(settings, /Reconcile Latest Response/);
  assert.match(index, /async function reconcileLatestResponse/);
  assert.match(index, /name: 'inventory-reconcile'/);
  assert.match(index, /aliases: \['inv-reconcile'\]/);
  assert.match(index, /registerSlashCommands\(\)/);
});

test('manual reconciliation uses generateRaw and shares backend validator', () => {
  const start = index.indexOf('async function reconcileLatestResponse');
  const end = index.indexOf('function registerSlashCommands', start);
  const block = index.slice(start, end);
  assert.match(block, /generateRaw\(\{ prompt: reconciliationPrompt \}\)/);
  assert.match(block, /buildReconciliationPrompt/);
  assert.match(block, /parseReconciliationReply/);
  assert.match(block, /createRevision/);
  assert.doesNotMatch(block, /generateQuietPrompt/);
});

test('successful automatic and manual reconciliation stamp exact message text', () => {
  assert.match(index, /function stampReconciliation/);
  assert.match(index, /textLength/);
  assert.match(index, /textHash/);
  assert.match(index, /stampReconciliation\(live, id, acceptedRevision\)/);
  assert.match(index, /This response has already been reconciled/);
});

test('manual reconciliation fails closed on unsafe legacy or concurrent state', () => {
  assert.match(index, /legacy response already carries an Inventory state change/i);
  assert.match(index, /Inventory or chat history changed while manual reconciliation was running/i);
  assert.match(index, /previous reconciliation boundary/i);
  assert.match(index, /generationLockFor\(ctx\)/);
  assert.match(index, /rawReconciliationActive > 0/);
});

test('manual Continue retry scans only text after the stamped boundary', () => {
  assert.match(index, /text\.slice\(stamp\.textLength\)/);
  assert.match(index, /reconciliationTextHash\(prefix\) !== stamp\.textHash/);
  assert.match(index, /type: stamp \? 'continue' : 'manual_reconcile'/);
});
''')

print('v0.3.5 transform complete')
