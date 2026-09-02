from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1: raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Fix escaped version fixtures that a plain string version bump does not touch.
for path in ['tests/integration-static.test.js', 'tests/release.test.js']:
    text = read(path).replace("0\\.3\\.4", "0\\.3\\.5")
    write(path, text)

# Exercise the new settings button through the fake DOM instead of only source text.
path = 'tests/settings-ui.test.js'
text = read(path)
text = once(text,
"'inventory_block_settings_edit', 'inventory_block_settings_history', 'inventory_block_settings_copy', 'inventory_block_history_retention'",
"'inventory_block_settings_edit', 'inventory_block_settings_history', 'inventory_block_settings_copy', 'inventory_block_settings_reconcile', 'inventory_block_history_retention'",
'settings fake DOM id list')
text = once(text,
"""    let copy = 0;\n    const options = { version: '0.2.3', onEdit: () => edit++, onHistory: () => history++, onCopy: () => copy++ };\n""",
"""    let copy = 0;\n    let reconcile = 0;\n    const options = { version: '0.2.3', onEdit: () => edit++, onHistory: () => history++, onCopy: () => copy++, onReconcile: async () => reconcile++ };\n""", 'settings reconcile counter')
text = once(text,
"""    settings.querySelector('#inventory_block_settings_copy').click();\n    assert.deepEqual({ edit, history, copy }, { edit: 2, history: 1, copy: 1 });\n""",
"""    settings.querySelector('#inventory_block_settings_copy').click();\n    settings.querySelector('#inventory_block_settings_reconcile').click();\n    assert.deepEqual({ edit, history, copy, reconcile }, { edit: 2, history: 1, copy: 1, reconcile: 1 });\n""", 'settings reconcile click')
# Source-reading focused test needs fs.
text = once(text, "import assert from 'node:assert/strict';\n", "import assert from 'node:assert/strict';\nimport fs from 'node:fs';\n", 'settings fs import')
write(path, text)

# Reconciliation stamps must persist with the active swipe's metadata too.
path = 'index.js'
text = read(path)
text = once(text,
"""    message.extra[EXTRA_KEY] = {\n        ...current,\n        reconcile: {\n            version: 1,\n            textLength: String(message.mes ?? '').length,\n            textHash: reconciliationTextHash(message.mes),\n            revision: revisionId,\n            at: Date.now(),\n        },\n    };\n    return message.extra[EXTRA_KEY].reconcile;\n}\n""",
"""    message.extra[EXTRA_KEY] = {\n        ...current,\n        reconcile: {\n            version: 1,\n            textLength: String(message.mes ?? '').length,\n            textHash: reconciliationTextHash(message.mes),\n            revision: revisionId,\n            at: Date.now(),\n        },\n    };\n    const swipeId = Number.isInteger(message.swipe_id) ? message.swipe_id : 0;\n    const swipe = Array.isArray(message.swipe_info) ? message.swipe_info[swipeId] : null;\n    if (swipe) {\n        swipe.extra ??= {};\n        swipe.extra[EXTRA_KEY] = structuredClone(message.extra[EXTRA_KEY]);\n    }\n    return message.extra[EXTRA_KEY].reconcile;\n}\n""", 'active swipe reconciliation stamp')

# Manual suffix retry must not replay the original user/admin directive.
text = once(text,
"""    const reconciliationPrompt = buildReconciliationPrompt(baseState, {\n        userText: latestUserTextBefore(ctx, id),\n        assistantText: eventText,\n        type: stamp ? 'continue' : 'manual_reconcile',\n        replaceCapability: null,\n    });\n""",
"""    const userText = stamp ? '' : latestUserTextBefore(ctx, id);\n    const replaceCapability = !stamp && isBroadInventoryAdministration(userText) ? createReplaceCapability() : null;\n    const reconciliationPrompt = buildReconciliationPrompt(baseState, {\n        userText,\n        assistantText: eventText,\n        type: stamp ? 'continue' : 'manual_reconcile',\n        replaceCapability,\n    });\n""", 'manual reconciliation user context')
text = once(text,
"const result = parseReconciliationReply(reply, baseState, { replaceCapability: null });",
"const result = parseReconciliationReply(reply, baseState, { replaceCapability });",
'manual replace capability parse')
write(path, text)

# Continue/append has no new user instruction and must never replay the prior admin request.
path = 'src/lifecycle.js'
text = read(path)
text = once(text,
"""export function userInstructionForGeneration(type, chat, composerText = '') {\n    const lower = normalizeGenerationType(type);\n    const composer = String(composerText ?? '').trim();\n    if ((lower === 'normal' || lower === 'group') && composer) return composer;\n    return latestUserMessageText(chat);\n}\n""",
"""export function userInstructionForGeneration(type, chat, composerText = '') {\n    const lower = normalizeGenerationType(type);\n    const composer = String(composerText ?? '').trim();\n    if ((lower === 'normal' || lower === 'group') && composer) return composer;\n    if (['continue', 'append', 'appendfinal'].includes(lower)) return '';\n    return latestUserMessageText(chat);\n}\n""", 'continue user instruction isolation')
write(path, text)

path = 'tests/lifecycle.test.js'
text = read(path)
text = once(text,
"""  assert.equal(userInstructionForGeneration('swipe',chat,'ignored'),'old');\n});\n""",
"""  assert.equal(userInstructionForGeneration('swipe',chat,'ignored'),'old');\n  assert.equal(userInstructionForGeneration('continue',chat,'ignored'),'');\n  assert.equal(userInstructionForGeneration('appendFinal',chat,'ignored'),'');\n});\n""", 'lifecycle continue regression')
write(path, text)

path = 'tests/v035-manual-reconcile.test.js'
text = read(path)
text = text.replace(
"  assert.match(index, /type: stamp \\? 'continue' : 'manual_reconcile'/);\n",
"  assert.match(index, /type: stamp \\? 'continue' : 'manual_reconcile'/);\n  assert.match(index, /const userText = stamp \\? '' : latestUserTextBefore/);\n  assert.match(index, /swipe\\.extra\\[EXTRA_KEY\\] = structuredClone/);\n")
write(path, text)

path = 'CHANGELOG.md'
text = read(path)
needle = '- The UI disables the manual button and shows `Reconciling…` while a retry is active.\n'
if needle in text and 'Continue/append reconciliation no longer replays' not in text:
    text = text.replace(needle, needle + '- Continue/append reconciliation no longer replays the prior user/OOC admin directive; only the new assistant suffix is considered.\n', 1)
write(path, text)

print('v0.3.5 corrective patch complete')
