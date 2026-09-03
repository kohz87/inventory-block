from pathlib import Path
import re

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text()

def write(path, text):
    (ROOT / path).write_text(text)

def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# Runtime: foreground one-pass Inventory control, manual raw scan only fallback.
# ---------------------------------------------------------------------------
path = 'src/reconcile.js'
text = read(path)
marker = """export function deriveAssistantEventText(type, beforeText, afterText) {\n"""
insert = """export function buildForegroundInventoryPrompt(state, { replaceCapability = null } = {}) {\n    const protocol = withResourceTrackingRule(buildInventoryPrompt(state, { replaceCapability }));\n    return `${protocol}\\n\\n` +\n        `Foreground one-pass accounting rule: write the visible response normally first. If and only if this response actually establishes completed Inventory changes, emit the single Inventory machine control required above after all visible prose and all other structured blocks as the final non-whitespace output. ` +\n        `The control is internal transport: Inventory Block will validate it, persist the resulting canonical state, and strip the control from the stored/displayed assistant message after generation completes. If nothing changes, emit no Inventory control.`;\n}\n\n"""
text = once(text, marker, insert + marker, 'foreground prompt helper insertion')
text = text.replace(
    'Write the story response normally; Inventory Block reconciles completed changes after the message finishes.',
    'Write the story response normally. This legacy read-only helper does not authorize Inventory writes.'
)
write(path, text)

path = 'src/protocol.js'
text = read(path)
text = once(
    text,
    'For an inventory change, emit exactly one standalone machine-only control outside all other XML/structured blocks. Other required response blocks may appear before or after it. A terminal period after the HTML comment is preferred for SillyTavern sentence-trimming compatibility, but a complete comment without it is accepted:\\n',
    'For an inventory change, emit exactly one standalone machine-only control outside all other XML/structured blocks. Place it after all visible prose and all other required response blocks, as the final non-whitespace content of the response. A terminal period after the HTML comment is preferred for SillyTavern sentence-trimming compatibility, but a complete comment without it is accepted:\\n',
    'terminal foreground control instruction',
)
write(path, text)

path = 'index.js'
text = read(path)
text = once(
    text,
    """    buildInventoryReferencePrompt,\n    buildReconciliationPrompt,\n    deriveAssistantEventText,\n    parseReconciliationReply,\n""",
    """    buildForegroundInventoryPrompt,\n    buildReconciliationPrompt,\n    parseReconciliationReply,\n""",
    'reconcile imports',
)

# Replace the automatic hidden raw reconciliation function with a completion-only
# foreground control commit. Manual reconciliation below remains generateRaw-based.
pattern = re.compile(r"async function reconcileCompletedSession\(session\) \{[\s\S]*?\n\}\n\nasync function reconcileLatestResponse")
replacement = """async function commitCompletedSession(session) {\n    if (!session || session.finished || session.stopped) return;\n    const ctx = context();\n    if (!ctx || chatIdOf(ctx) !== session.chatId) {\n        console.warn('[Inventory Block] Completed foreground Inventory commit was skipped because the active chat changed.');\n        removeSession(session);\n        return;\n    }\n    const id = Number(session.messageId);\n    const message = ctx.chat?.[id];\n    if (!Number.isInteger(id) || !message || message.is_user || message.is_system) {\n        removeSession(session);\n        return;\n    }\n\n    // The foreground model already made the accounting decision in the same inference\n    // that wrote the story. At completion we only parse, validate, persist and strip the\n    // machine control. No second LLM request is started here.\n    await processAssistantMessage(id, session.type);\n    if (sessions.snapshot().includes(session)) {\n        session.finished = true;\n        removeSession(session);\n    }\n}\n\nasync function reconcileLatestResponse"""
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'automatic reconciliation replacement: expected one match, found {count}')

text = text.replace('reconciliationStarted', 'commitStarted')
text = text.replace('maybeStartReconciliation', 'maybeStartForegroundCommit')

text = once(
    text,
    """function maybeStartForegroundCommit(session, { messageReceivedIsFinal = false } = {}) {\n    if (!session || session.finished || session.stopped || session.commitStarted || !session.messageReceived) return;\n    if (!session.generationEnded && !messageReceivedIsFinal) return;\n    session.commitStarted = true;\n    if (session.completionFallbackTimer) clearTimeout(session.completionFallbackTimer);\n    session.completionFallbackTimer = null;\n    const terminalTimer = terminalCleanupTimers.get(session);\n    if (terminalTimer) clearTimeout(terminalTimer);\n    terminalCleanupTimers.delete(session);\n    void reconcileCompletedSession(session);\n}\n""",
    """function maybeStartForegroundCommit(session, { messageReceivedIsFinal = false } = {}) {\n    if (!session || session.finished || session.stopped || session.commitStarted || !session.messageReceived) return;\n    if (!session.generationEnded && !messageReceivedIsFinal) return;\n    session.commitStarted = true;\n    if (session.completionFallbackTimer) clearTimeout(session.completionFallbackTimer);\n    session.completionFallbackTimer = null;\n    const terminalTimer = terminalCleanupTimers.get(session);\n    if (terminalTimer) clearTimeout(terminalTimer);\n    terminalCleanupTimers.delete(session);\n    void commitCompletedSession(session);\n}\n""",
    'foreground commit latch',
)

text = once(
    text,
    'try { rememberDryRun(chatId, buildInventoryReferencePrompt(getCurrentInventory(ctx)), ctx); }',
    'try { rememberDryRun(chatId, buildForegroundInventoryPrompt(getCurrentInventory(ctx)), ctx); }',
    'dry-run foreground prompt',
)
text = once(
    text,
    'const prompt = buildInventoryReferencePrompt(getInventoryAt(root, baseRevision));',
    'const prompt = buildForegroundInventoryPrompt(getInventoryAt(root, baseRevision), { replaceCapability });',
    'foreground prompt preparation',
)
text = text.replace(
    "console.warn('[Inventory Block] Read-only inventory reference was unavailable to the visible response; hidden post-response reconciliation can still run.');",
    "console.warn('[Inventory Block] Foreground Inventory tracking was unavailable to this response; automatic Inventory writes are disabled for it. Use Reconcile Latest Response only if recovery is needed.');",
)
text = text.replace(
    'This legacy response already carries an Inventory state change but has no v0.3.5 reconciliation stamp. Manual retry was refused to avoid double-counting it.',
    'This response already carries an Inventory state change but has no manual-reconciliation boundary. Manual retry was refused to avoid double-counting it.',
)
write(path, text)

# ---------------------------------------------------------------------------
# Release metadata and documentation.
# ---------------------------------------------------------------------------
for path in ['manifest.json', 'package.json']:
    text = read(path)
    text = once(text, '"version": "0.3.7"', '"version": "0.4.0"', f'{path} version')
    write(path, text)

path = 'src/constants.js'
text = read(path)
text = once(text, "export const VERSION = '0.3.7';", "export const VERSION = '0.4.0';", 'runtime version')
write(path, text)

path = 'style.css'
text = read(path)
text = once(text, '/* Inventory Block v0.3.7 */', '/* Inventory Block v0.4.0 */', 'style version')
write(path, text)

path = 'README.md'
text = read(path)
text = once(text, '# Inventory Block v0.3.7', '# Inventory Block v0.4.0', 'README title')
start = text.index('## LLM integration')
end = text.index('## History, comparison and retention')
llm_section = """## LLM integration\n\nInventory Block v0.4.0 uses a **one-pass foreground accounting architecture**. At SillyTavern's final prompt-ready stage, the extension injects the current canonical Inventory JSON plus the compact validated patch protocol into the same assistant generation that writes the RP response. The model writes the visible story first and, only when that response establishes completed possession/resource changes, emits one hidden `INVENTORY_BLOCK_UPDATE` machine control as the final output.\n\nWhen generation is complete, Inventory Block does **not** start another model session. It parses that foreground control, validates the complete patch atomically, commits the resulting canonical backend revision, attaches branch/swipe metadata, and strips the machine control from the stored/displayed assistant message. The temporary Inventory prompt is never added to chat history, and the machine control is transport rather than storage. Future prompts receive only the latest canonical backend state.\n\nIf the foreground response emits no Inventory control, Inventory remains unchanged. If a model forgets or mangles a required update, **Reconcile Latest Response** (or `/inventory-reconcile`) remains available as an explicit recovery action; only that manual fallback uses the separate `generateRaw` scanner. Normal RP turns therefore require one LLM request rather than a story request plus an automatic reconciliation request.\n\nFull replacement remains available only for an explicit bracketed OOC/admin inventory directive such as:\n\n```text\n[OOC: create category for each party member]\n[Compact all food related items into 1 food item and remark the quantity in duration]\n```\n\nCompleted gains and losses of tracked finite resources are treated as Inventory changes. This includes money, food, water, ammunition, fuel, medicine, crafting supplies, charges, and ordinary possessions. Plain numeric Quantity values use `adjust_item`; single numeric balances stored in Remark use backend-enforced `adjust_resource`; semantic Remark states such as Full/Half full/Empty use `edit_item`. Approximate descriptions such as `About 7 days` remain approximate rather than being converted into invented exact units.\n\nOnly completed changes count. Planned, attempted, negotiated, interrupted, or failed actions do not spend or grant resources unless the response establishes that they actually happened. Durable containers can remain when empty, such as `Coin Pouch | 1 | 0 Gold` or `Waterskin | 1 | Empty`; exhausted rows that represent the consumable stock itself are removed instead of becoming ghost stock. Negative resource balances are forbidden, and related changes from the same event are emitted in one atomic patch.\n\nQuiet/background and impersonation generations do not receive Inventory state and cannot mutate Inventory.\n\n"""
text = text[:start] + llm_section + text[end:]
text = text.replace(
    'v0.3.5 also adds **Reconcile Latest Response** for retrying a failed post-response scan; already-reconciled text is stamped and will not be charged twice.',
    'The settings UI includes **Reconcile Latest Response** as an explicit fallback when a foreground response omitted or failed its Inventory control; successfully manual-reconciled text is stamped and will not be charged twice.',
)
write(path, text)

path = 'CHANGELOG.md'
text = read(path)
entry = """## 0.4.0\n\nOne-pass foreground Inventory accounting.\n\n- Returns Inventory reasoning to the same LLM inference that writes the RP response while keeping canonical state in the separate backend.\n- Injects authoritative Inventory JSON, finite-resource rules, and the compact patch schema only at final prompt-ready time; nothing is added to persistent chat history.\n- Requires any generated `INVENTORY_BLOCK_UPDATE` to be the final machine-only response element, after visible prose and other structured blocks.\n- Processes the completed foreground response once: validate the patch atomically, commit its backend revision/branch metadata, then strip the machine control from the stored/displayed message.\n- Removes the automatic post-response `generateRaw` scan, eliminating the normal second LLM round-trip and its reinterpretation/latency cost.\n- Keeps **Reconcile Latest Response** and `/inventory-reconcile` as explicit `generateRaw` recovery tools when a foreground update was omitted or malformed.\n- Keeps v0.3.7 durable branch anchors, swipe/deletion rollback semantics, streaming UI suspension, and backend negative-resource guards unchanged.\n\n"""
text = entry + text
write(path, text)

path = 'TEST-REPORT.md'
text = read(path)
text = text.replace('# Inventory Block v0.3.7 Raw Reconciliation Compatibility Report', '# Inventory Block v0.4.0 One-Pass Foreground Accounting Report', 1)
text = text.replace('Date: 2026-09-02', 'Date: 2026-09-03', 1)
anchor = '## v0.3.5 manual reconciliation recovery\n'
section = """## v0.4.0 one-pass foreground accounting\n\nv0.4.0 removes the automatic post-response `generateRaw` request. The final prompt-ready injection now gives the visible assistant generation authoritative Inventory state plus the validated patch protocol. Any generated machine control is consumed only after completion, committed to canonical backend history, then stripped from the stored/displayed message. Manual reconciliation remains the only raw second-pass path.\n\nThe v0.4.0 release gate specifically checks that normal completion never calls `generateRaw`, foreground controls still use the existing atomic backend validator, missing controls leave Inventory unchanged and recoverable manually, Continue/Swipe branch behavior remains backend-driven, and the terminal control is not retained as persistent story text.\n\n"""
text = once(text, anchor, section + anchor, 'test report v0.4.0 section')
write(path, text)

# ---------------------------------------------------------------------------
# Tests: update historical architecture assertions and add v0.4.0 regressions.
# ---------------------------------------------------------------------------
write('tests/integration-static.test.js', """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst index=fs.readFileSync(new URL('../index.js',import.meta.url),'utf8');\nconst constants=fs.readFileSync(new URL('../src/constants.js',import.meta.url),'utf8');\nconst manifest=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));\nconst pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));\n\ntest('release metadata, runtime version, and interceptor are v0.4.0',()=>{\n  assert.equal(manifest.version,'0.4.0');\n  assert.equal(pkg.version,'0.4.0');\n  assert.match(constants,/VERSION = '0\\.4\\.0'/);\n  assert.equal(manifest.generate_interceptor,'inventoryBlockGenerationInterceptor');\n  assert.match(index,/globalThis\\.inventoryBlockGenerationInterceptor\\s*=\\s*onGenerationInterceptor/);\n});\n\ntest('v0.4.0 has no fake prompt slot or global live extension prompt',()=>{\n  assert.doesNotMatch(index,/promptSlots|createPromptSlotMarker|insertPromptSlot|setExtensionPrompt/);\n  assert.doesNotMatch(index,/inventoryBlockSlot|base64/i);\n});\n\ntest('completed foreground messages commit inline controls only after completion signals',()=>{\n  assert.match(index,/GENERATION_ENDED[^\\n]*onGenerationEnded/);\n  assert.match(index,/MESSAGE_RECEIVED[^\\n]*onMessageReceived/);\n  assert.match(index,/maybeStartForegroundCommit/);\n  assert.match(index,/commitCompletedSession/);\n  assert.match(index,/buildForegroundInventoryPrompt/);\n  assert.doesNotMatch(index,/reconcileCompletedSession/);\n  const start=index.indexOf('async function commitCompletedSession');\n  const end=index.indexOf('async function reconcileLatestResponse',start);\n  const block=index.slice(start,end);\n  assert.match(block,/processAssistantMessage/);\n  assert.doesNotMatch(block,/generateRaw|buildReconciliationPrompt|parseReconciliationReply/);\n});\n\ntest('existing initial group greetings are scanned on load',()=>{\n  assert.match(index,/seedInitialGreetingsIfNeeded/);\n  assert.match(index,/seed_existing/);\n});\n""")

write('tests/v033-reconcile.test.js', """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport { buildForegroundInventoryPrompt, buildInventoryReferencePrompt, buildReconciliationPrompt, deriveAssistantEventText, parseReconciliationReply } from '../src/reconcile.js';\n\nconst base = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }, { name: 'Arrows', quantity: '5', remark: '' }] }] };\nconst control = payload => '<!-- INVENTORY_BLOCK_UPDATE ' + JSON.stringify(payload) + ' -->.';\n\ntest('foreground Inventory prompt contains canonical state, machine protocol and resource accounting', () => {\n  const prompt = buildForegroundInventoryPrompt(base);\n  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);\n  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);\n  assert.match(prompt, /adjust_resource|add_item|delete_item/);\n  assert.match(prompt, /Finite-resource and possession accounting/);\n  assert.match(prompt, /one-pass accounting/i);\n  assert.match(prompt, /final non-whitespace output/i);\n});\n\ntest('legacy read-only helper remains non-writing for compatibility', () => {\n  const prompt = buildInventoryReferencePrompt(base);\n  assert.match(prompt, /INVENTORY_REFERENCE_JSON_BEGIN/);\n  assert.doesNotMatch(prompt, /INVENTORY_BLOCK_UPDATE/);\n});\n\ntest('manual reconciliation prompt still contains protocol, completed event, and resource accounting', () => {\n  const prompt = buildReconciliationPrompt(base, { userText: 'Buy a ration for 15 Gold.', assistantText: 'You pay 15 Gold and take the ration.', type: 'normal' });\n  assert.match(prompt, /hidden post-response reconciler/i);\n  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);\n  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);\n  assert.match(prompt, /Finite-resource and possession accounting/);\n  assert.match(prompt, /completedAssistantEvent/);\n  assert.match(prompt, /Return exactly NO_CHANGE/);\n});\n\ntest('manual Continue reconciliation helper scans only newly appended text', () => {\n  const before = 'Earlier paragraph where 15 Gold was already paid.';\n  const after = before + '\\n\\nNew paragraph: you drink one potion.';\n  const result = deriveAssistantEventText('continue', before, after);\n  assert.equal(result.error, null);\n  assert.equal(result.text, '\\n\\nNew paragraph: you drink one potion.');\n  assert.doesNotMatch(result.text, /15 Gold/);\n});\n\ntest('manual Continue prefix mismatch fails closed', () => {\n  const result = deriveAssistantEventText('continue', 'old text', 'rewritten old text plus new');\n  assert.match(result.error, /refused to rescan/i);\n  assert.equal(result.text, '');\n});\n\ntest('manual reconciliation parser accepts NO_CHANGE and a single validated control', () => {\n  const none = parseReconciliationReply('NO_CHANGE', base);\n  assert.deepEqual(none.errors, []);\n  assert.equal(none.changed, false);\n  const reply = control({ mode: 'patch', ops: [{ op: 'adjust_resource', category: 'General', name: 'Coin Pouch', by: -15 }] });\n  const changed = parseReconciliationReply(reply, base);\n  assert.deepEqual(changed.errors, []);\n  assert.equal(changed.state.categories[0].items[0].remark, '85 Gold');\n});\n\ntest('manual reconciliation parser rejects prose around the machine control', () => {\n  const reply = 'Here is the update:\\n' + control({ mode: 'patch', ops: [{ op: 'adjust_item', category: 'General', name: 'Arrows', by: -1 }] });\n  const result = parseReconciliationReply(reply, base);\n  assert.equal(result.changed, false);\n  assert.match(result.errors.join(' '), /extra text/i);\n});\n\ntest('runtime foreground completion contains no automatic second LLM request', () => {\n  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n  const start = index.indexOf('async function commitCompletedSession');\n  const end = index.indexOf('async function reconcileLatestResponse', start);\n  const block = index.slice(start, end);\n  assert.match(index, /const prompt = buildForegroundInventoryPrompt/);\n  assert.match(block, /processAssistantMessage/);\n  assert.doesNotMatch(block, /generateRaw|generateQuietPrompt|buildReconciliationPrompt|parseReconciliationReply/);\n  assert.match(index, /MESSAGE_RECEIVED[^\\n]*onMessageReceived/);\n  assert.match(index, /GENERATION_ENDED[^\\n]*onGenerationEnded/);\n  assert.match(index, /COMPLETION_FALLBACK_MS/);\n});\n""")

write('tests/v034-raw-compat.test.js', """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\n\nconst index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n\ntest('generateRaw is retained only for explicit manual recovery', () => {\n  const autoStart = index.indexOf('async function commitCompletedSession');\n  const manualStart = index.indexOf('async function reconcileLatestResponse');\n  const manualEnd = index.indexOf('function registerSlashCommands', manualStart);\n  assert.ok(autoStart >= 0 && manualStart > autoStart && manualEnd > manualStart);\n  assert.doesNotMatch(index.slice(autoStart, manualStart), /generateRaw/);\n  const manual = index.slice(manualStart, manualEnd);\n  assert.match(manual, /const generateRaw = ctx\\.generateRaw/);\n  assert.match(manual, /await generateRaw\\(\\{ prompt: reconciliationPrompt \\}\\)/);\n  assert.match(manual, /buildReconciliationPrompt/);\n  assert.match(manual, /parseReconciliationReply/);\n  assert.doesNotMatch(manual, /generateQuietPrompt/);\n});\n\ntest('manual raw recovery remains isolated from foreground prompt-ready injection', () => {\n  assert.match(index, /let rawReconciliationActive = 0/);\n  assert.match(index, /rawReconciliationActive \\+= 1/);\n  assert.match(index, /rawReconciliationActive = Math\\.max\\(0, rawReconciliationActive - 1\\)/);\n  assert.match(index, /if \\(rawReconciliationActive > 0\\) return/);\n});\n""")

path = 'tests/v035-manual-reconcile.test.js'
text = read(path)
text = text.replace('successful automatic and manual reconciliation stamp exact message text', 'successful manual reconciliation stamps exact message text')
text = text.replace("  assert.match(index, /stampReconciliation\\(live, id, acceptedRevision\\)/);\n", '')
write(path, text)

write('tests/release.test.js', """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');\n\ntest('all release metadata and runtime VERSION say 0.4.0', () => {\n  assert.equal(JSON.parse(read('manifest.json')).version, '0.4.0');\n  assert.equal(JSON.parse(read('package.json')).version, '0.4.0');\n  assert.match(read('src/constants.js'), /VERSION = '0\\.4\\.0'/);\n  assert.match(read('style.css'), /^\\/\\* Inventory Block v0\\.4\\.0 \\*\\//);\n  assert.match(read('README.md'), /Inventory Block v0\\.4\\.0/);\n});\n\ntest('changelog documents one-pass v0.4.0 while retaining manual raw recovery history', () => {\n  const changelog=read('CHANGELOG.md');\n  assert.match(changelog,/## 0\\.4\\.0/);\n  assert.match(changelog,/one-pass foreground/i);\n  assert.match(changelog,/Removes the automatic post-response `generateRaw` scan/i);\n  assert.match(changelog,/Reconcile Latest Response/i);\n  assert.match(changelog,/## 0\\.3\\.7/);\n  assert.match(changelog,/## 0\\.3\\.5/);\n  assert.match(changelog,/inventory-reconcile/i);\n  assert.match(changelog,/## 0\\.3\\.4/);\n  assert.match(changelog,/generateRaw/);\n  assert.match(changelog,/## 0\\.3\\.3/);\n  assert.match(changelog,/generateQuietPrompt/);\n});\n\ntest('v0.4.0 keeps backend hardening behind foreground one-pass controls', () => {\n  const protocol=read('src/protocol.js');\n  const injection=read('src/injection.js');\n  const resources=read('src/resources.js');\n  const reconcile=read('src/reconcile.js');\n  const history=read('src/history.js');\n  const ui=read('src/ui.js');\n  const settings=read('src/settings.js');\n  const constants=read('src/constants.js');\n  assert.match(protocol,/final non-whitespace content/i);\n  assert.match(protocol,/Every object in "ops" MUST contain a string "op" field/);\n  assert.match(injection,/withResourceTrackingRule/);\n  assert.match(reconcile,/buildForegroundInventoryPrompt/);\n  assert.match(reconcile,/buildReconciliationPrompt/);\n  assert.match(reconcile,/NO_CHANGE/);\n  assert.match(resources,/About 7 days/);\n  assert.match(resources,/adjust_resource/);\n  assert.match(protocol,/adjust_resource\\{category,name,by,deleteAtZero\\?\\}/);\n  assert.match(constants,/historyBytes/);\n  assert.match(constants,/portableCheckpointBytes/);\n  assert.match(history,/clearInventoryHistory/);\n  assert.match(ui,/compareInventoryStates/);\n  assert.match(settings,/Trim History Now/);\n  assert.match(settings,/Clear History/);\n  assert.match(constants,/50, 100, 200, 500, 768/);\n});\n""")

write('tests/v040-one-pass.test.js', """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport { consumeInventoryUpdates } from '../src/protocol.js';\nimport { buildForegroundInventoryPrompt } from '../src/reconcile.js';\n\nconst base = { categories: [{ name: 'General', items: [{ name: 'Coin Pouch', quantity: '1', remark: '100 Gold' }] }] };\n\ntest('one-pass prompt authorizes a terminal hidden patch in the same foreground response', () => {\n  const prompt = buildForegroundInventoryPrompt(base);\n  assert.match(prompt, /INVENTORY_STATE_JSON_BEGIN/);\n  assert.match(prompt, /INVENTORY_BLOCK_UPDATE/);\n  assert.match(prompt, /write the visible response normally first/i);\n  assert.match(prompt, /final non-whitespace output/i);\n  assert.match(prompt, /If nothing changes, emit no Inventory control/i);\n});\n\ntest('foreground machine transport persists state while stripping itself from story text', () => {\n  const story = 'Lucien pays twenty gold and takes the parcel.';\n  const machine = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"adjust_resource","category":"General","name":"Coin Pouch","by":-20}]} -->.';\n  const result = consumeInventoryUpdates(`${story}\\n\\n${machine}`, base);\n  assert.deepEqual(result.errors, []);\n  assert.equal(result.changed, true);\n  assert.equal(result.state.categories[0].items[0].remark, '80 Gold');\n  assert.equal(result.cleanedText.trim(), story);\n  assert.doesNotMatch(result.cleanedText, /INVENTORY_BLOCK_UPDATE/);\n});\n\ntest('no foreground control means no synthetic Inventory mutation', () => {\n  const story = 'Lucien studies the parcel without touching his coin pouch.';\n  const result = consumeInventoryUpdates(story, base);\n  assert.deepEqual(result.errors, []);\n  assert.equal(result.hadControl, false);\n  assert.equal(result.changed, false);\n  assert.deepEqual(result.state, base);\n  assert.equal(result.cleanedText, story);\n});\n\ntest('automatic completion path never starts a second model session', () => {\n  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n  const autoStart = index.indexOf('async function commitCompletedSession');\n  const manualStart = index.indexOf('async function reconcileLatestResponse');\n  assert.ok(autoStart >= 0 && manualStart > autoStart);\n  const automatic = index.slice(autoStart, manualStart);\n  assert.match(automatic, /processAssistantMessage/);\n  assert.doesNotMatch(automatic, /generateRaw|generateQuietPrompt/);\n  assert.match(index, /message\\.mes = result\\.cleanedText/);\n  assert.match(index, /persistChatSoon\\(ctx, chatId\\)/);\n});\n\ntest('foreground generation gets replace capability in the same injected prompt when admin-authorized', () => {\n  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n  assert.match(index, /buildForegroundInventoryPrompt\\(getInventoryAt\\(root, baseRevision\\), \\{ replaceCapability \\}\\)/);\n  assert.match(index, /session\\?\\.replaceCapability/);\n});\n""")

print('v0.4.0 one-pass transform complete')
