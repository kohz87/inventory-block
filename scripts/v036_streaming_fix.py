from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# index.js
path='index.js'
text=read(path)
text=once(text,
"import { initializeMeguminBridge, scheduleInventoryMount } from './src/megumin.js';",
"import { initializeMeguminBridge, scheduleInventoryMount, setInventoryMountSuspended } from './src/megumin.js';",
'import mount suspension')
text=once(text,
"""function generationLockFor(ctx) {\n    return sessions.activeForChat(chatIdOf(ctx));\n}\n\nfunction generationForMessage(ctx, messageId, eventType = '') {\n""",
"""function generationLockFor(ctx) {\n    return sessions.activeForChat(chatIdOf(ctx));\n}\n\nfunction syncInventoryMountSuspension() {\n    const ctx = context();\n    const chatId = chatIdOf(ctx);\n    setInventoryMountSuspended(Boolean(chatId && sessions.activeForChat(chatId)));\n}\n\nfunction generationForMessage(ctx, messageId, eventType = '') {\n""", 'mount suspension helper')
text=once(text,
"""    sessions.remove(session);\n    if (!sessions.size && watchdog) {\n""",
"""    sessions.remove(session);\n    syncInventoryMountSuspension();\n    if (!sessions.size && watchdog) {\n""", 'release suspension after session removal')
text=once(text,
"""function refreshAll() {\n    scheduleInventoryMount(30);\n}\n""",
"""function refreshAll() {\n    scheduleInventoryMount(30, { force: true });\n}\n""", 'force explicit refresh')
text=once(text,
"""        });\n        armWatchdog();\n    } catch (error) {\n        console.warn('[Inventory Block] Could not prepare generation inventory state.', error);\n""",
"""        });\n        syncInventoryMountSuspension();\n        armWatchdog();\n    } catch (error) {\n        syncInventoryMountSuspension();\n        console.warn('[Inventory Block] Could not prepare generation inventory state.', error);\n""", 'suspend after session creation')
old="""function onMessageUpdated(messageId, type = 'updated', manualEdit = false) {\n    const ctx = context();\n    if (ctx) invalidateLineageCache(ctx);\n    const message = ctx?.chat?.[Number(messageId)];\n    if (!message) return;\n    if (message.is_user || message.is_system) {\n        setTimeout(() => void resolveBranchAndRefresh(), 0);\n        return;\n    }\n    const active = generationForMessage(ctx, messageId, type);\n    if (!manualEdit && active) return;\n    if (hasCompleteInventoryUpdate(message.mes) || (manualEdit && hasInventoryControl(message.mes))) void processAssistantMessage(messageId, type);\n    else setTimeout(() => void resolveBranchAndRefresh(), 0);\n}\n"""
new="""function onMessageUpdated(messageId, type = 'updated', manualEdit = false) {\n    const ctx = context();\n    const message = ctx?.chat?.[Number(messageId)];\n    if (!message) return;\n\n    // SillyTavern emits MESSAGE_UPDATED repeatedly while a response streams. Match\n    // by message identity only here: the event label \"updated\" is not the original\n    // generation type (normal/continue/swipe/etc.). Streaming updates must be inert.\n    if (!manualEdit && !message.is_user && !message.is_system && generationForMessage(ctx, messageId)) return;\n\n    if (ctx) invalidateLineageCache(ctx);\n    if (message.is_user || message.is_system) {\n        setTimeout(() => void resolveBranchAndRefresh(), 0);\n        return;\n    }\n    if (hasCompleteInventoryUpdate(message.mes) || (manualEdit && hasInventoryControl(message.mes))) void processAssistantMessage(messageId, type);\n    else setTimeout(() => void resolveBranchAndRefresh(), 0);\n}\n"""
text=once(text, old, new, 'streaming MESSAGE_UPDATED early return')
text=once(text,
"""function onChatChanged() {\n    // Generation sessions deliberately survive UI chat switches; each carries its own\n    // chat id, state snapshot, token counter, and prompt. This prevents cross-chat bleed.\n    processingMessages.clear();\n    setTimeout(() => void resolveBranchAndRefresh(), 0);\n}\n""",
"""function onChatChanged() {\n    // Generation sessions deliberately survive UI chat switches; each carries its own\n    // chat id, state snapshot, token counter, and prompt. This prevents cross-chat bleed.\n    processingMessages.clear();\n    syncInventoryMountSuspension();\n    setTimeout(() => void resolveBranchAndRefresh(), 0);\n}\n""", 'sync suspension on chat switch')
write(path,text)

# src/megumin.js
path='src/megumin.js'
text=read(path)
text=once(text,
"""let renderCurrent = null;\nlet mountedMessageElement = null;\n""",
"""let renderCurrent = null;\nlet mountedMessageElement = null;\nlet mountSuspended = false;\nlet forceRender = false;\n""", 'megumin state')
text=once(text,
"""function mountNow() {\n    if (!renderCurrent || !globalThis.SillyTavern?.getContext) return;\n    const context = SillyTavern.getContext();\n    const messageElement = latestAssistantMessageElement(context);\n    if (!messageElement) {\n        cleanupPreviousMount(null);\n        return;\n    }\n    cleanupPreviousMount(messageElement);\n\n    const meguminCard = messageElement.querySelector('.meg-blocks');\n""",
"""function mountNow() {\n    if (!renderCurrent || !globalThis.SillyTavern?.getContext || mountSuspended) return;\n    const context = SillyTavern.getContext();\n    const messageElement = latestAssistantMessageElement(context);\n    if (!messageElement) {\n        cleanupPreviousMount(null);\n        forceRender = false;\n        return;\n    }\n\n    const hasExistingMount = Boolean(messageElement.querySelector('.inventory-block-pane, .inventory-block-card'));\n    if (!forceRender && mountedMessageElement === messageElement && hasExistingMount) return;\n    forceRender = false;\n    cleanupPreviousMount(messageElement);\n\n    const meguminCard = messageElement.querySelector('.meg-blocks');\n""", 'dedupe mount')
text=once(text,
"""export function scheduleInventoryMount(delay = 60) {\n    ensureObserver();\n    if (timer) clearTimeout(timer);\n    timer = setTimeout(() => {\n        timer = null;\n        mountNow();\n    }, delay);\n}\n\nexport function initializeMeguminBridge(renderPane) {\n    renderCurrent = renderPane;\n    ensureObserver();\n    scheduleInventoryMount(0);\n}\n""",
"""export function scheduleInventoryMount(delay = 60, { force = false } = {}) {\n    ensureObserver();\n    if (force) forceRender = true;\n    if (mountSuspended) return;\n    if (timer) clearTimeout(timer);\n    timer = setTimeout(() => {\n        timer = null;\n        mountNow();\n    }, delay);\n}\n\nexport function setInventoryMountSuspended(value) {\n    const next = Boolean(value);\n    if (mountSuspended === next) return;\n    mountSuspended = next;\n    if (mountSuspended) {\n        if (timer) clearTimeout(timer);\n        timer = null;\n        return;\n    }\n    forceRender = true;\n    scheduleInventoryMount(0, { force: true });\n}\n\nexport function initializeMeguminBridge(renderPane) {\n    renderCurrent = renderPane;\n    ensureObserver();\n    scheduleInventoryMount(0, { force: true });\n}\n""", 'suspended schedule API')
write(path,text)

# release metadata
for path in ['manifest.json','package.json','src/constants.js','style.css','README.md','TEST-REPORT.md']:
    text=read(path)
    if '0.3.5' not in text: raise SystemExit(f'{path}: missing 0.3.5')
    text=text.replace('0.3.5','0.3.6',1)
    write(path,text)

# changelog
path='CHANGELOG.md'
text=read(path)
entry="""## 0.3.6\n\nStreaming/UI hardening for post-response reconciliation.\n\n- Freezes Inventory Block mounting and rendering while a tracked foreground assistant generation is active.\n- Treats token-by-token `MESSAGE_UPDATED` events as inert when they belong to any active Inventory generation, regardless of the original generation type.\n- Stops streaming updates from repeatedly resolving branch state, invalidating lineage caches, scheduling metadata saves, and rebuilding the Inventory pane.\n- Makes Megumin/standalone mounts render-aware so ordinary chat DOM mutations do not rebuild an unchanged Inventory pane.\n- Performs one forced Inventory remount after the generation/reconciliation session settles.\n- Keeps chat-switch handling scoped to the active chat so background sessions cannot freeze an unrelated chat UI.\n\n"""
text=entry+text
write(path,text)

# release tests
path='tests/release.test.js'
text=read(path)
text=once(text,"test('all release metadata and runtime VERSION say 0.3.5'", "test('all release metadata and runtime VERSION say 0.3.6'", 'release title')
text=text.replace("'0.3.5'","'0.3.6'",2)
text=text.replace("/VERSION = '0\\.3\\.5'/","/VERSION = '0\\.3\\.6'/",1)
text=text.replace("v0\\.3\\.5","v0\\.3\\.6",2)
write(path,text)

# dedicated regression tests
path='tests/v036-streaming-ui.test.js'
write(path,"""import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');\n\ntest('streaming MESSAGE_UPDATED exits before lineage or branch refresh work', () => {\n  const index = read('index.js');\n  assert.match(index, /generationForMessage\\(ctx, messageId\\)\\) return;/);\n  assert.doesNotMatch(index, /generationForMessage\\(ctx, messageId, type\\)/);\n  const fn = index.slice(index.indexOf('function onMessageUpdated'), index.indexOf('function onMessageSwiped'));\n  assert.ok(fn.indexOf('generationForMessage(ctx, messageId)') < fn.indexOf('invalidateLineageCache(ctx)'));\n});\n\ntest('mount bridge can be suspended for foreground streaming', () => {\n  const megumin = read('src/megumin.js');\n  assert.match(megumin, /export function setInventoryMountSuspended/);\n  assert.match(megumin, /if \\(mountSuspended\\) return;/);\n  assert.match(megumin, /mountedMessageElement === messageElement && hasExistingMount/);\n  assert.match(megumin, /scheduleInventoryMount\\(0, \\{ force: true \\}\\)/);\n});\n\ntest('runtime synchronizes mount suspension with active generation sessions', () => {\n  const index = read('index.js');\n  assert.match(index, /setInventoryMountSuspended\\(Boolean\\(chatId && sessions\\.activeForChat\\(chatId\\)\\)\\)/);\n  assert.match(index, /sessions\\.remove\\(session\\);\\n    syncInventoryMountSuspension\\(\\);/);\n  assert.match(index, /syncInventoryMountSuspension\\(\\);\\n        armWatchdog\\(\\);/);\n  assert.match(index, /scheduleInventoryMount\\(30, \\{ force: true \\}\\)/);\n});\n""")
print('v0.3.6 transform complete')
