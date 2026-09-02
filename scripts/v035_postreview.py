from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1: raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

path = 'index.js'
text = read(path)
text = once(text,
"""    const ctx = context();\n    if (!ctx || !hasActiveChat(ctx)) throw new Error('Open a chat before reconciling inventory.');\n""",
"""    const ctx = context();\n    if (!ctx || !hasActiveChat(ctx)) throw new Error('Open a chat before reconciling inventory.');\n    const expectedChatId = chatIdOf(ctx);\n""", 'pin manual reconcile chat id')
text = once(text,
"""    const live = context();\n    if (!live || chatIdOf(live) !== chatIdOf(ctx)) throw new Error('The active chat changed while manual inventory reconciliation was running. Its result was discarded.');\n""",
"""    const live = context();\n    if (!live || chatIdOf(live) !== expectedChatId) throw new Error('The active chat changed while manual inventory reconciliation was running. Its result was discarded.');\n""", 'stable manual chat check')
text = once(text,
"""    const pseudoSession = { chatId: chatIdOf(live), type: stamp ? 'continue' : 'manual_reconcile' };\n""",
"""    const pseudoSession = { chatId: expectedChatId, type: stamp ? 'continue' : 'manual_reconcile' };\n""", 'stable pseudo session chat')
text = once(text,
"""    persistChatSoon(live, chatIdOf(live));\n""",
"""    persistChatSoon(live, expectedChatId);\n""", 'stable manual persist chat')
text = once(text,
"""    if (!Parser?.addCommandObject || !Command?.fromProps) return;\n    try {\n""",
"""    if (!Parser?.addCommandObject || !Command?.fromProps) return;\n    if (Parser.commands && Object.hasOwn(Parser.commands, 'inventory-reconcile')) {\n        slashCommandsRegistered = true;\n        return;\n    }\n    try {\n""", 'slash duplicate guard')
write(path, text)

path = 'tests/v035-manual-reconcile.test.js'
text = read(path)
needle = "  assert.match(index, /rawReconciliationActive > 0/);\n"
if needle in text and 'expectedChatId' not in text:
    text = text.replace(needle, needle + "  assert.match(index, /const expectedChatId = chatIdOf\\(ctx\\)/);\n  assert.doesNotMatch(index, /chatIdOf\\(live\\) !== chatIdOf\\(ctx\\)/);\n", 1)
write(path, text)

path = 'tests/release.test.js'
text = read(path)
text = text.replace("test('changelog documents v0.3.5 raw reconciliation compatibility and retains prior hardening', () => {", "test('changelog documents v0.3.5 manual reconciliation recovery and retains prior hardening', () => {")
text = once(text,
"""  assert.match(changelog,/## 0\\.3\\.5/);\n  assert.match(changelog,/generateRaw/);\n  assert.match(changelog,/minimal raw generation path/i);\n""",
"""  assert.match(changelog,/## 0\\.3\\.5/);\n  assert.match(changelog,/Reconcile Latest Response/i);\n  assert.match(changelog,/inventory-reconcile/i);\n  assert.match(changelog,/stamp the exact assistant text\\/revision/i);\n  assert.match(changelog,/## 0\\.3\\.4/);\n  assert.match(changelog,/generateRaw/);\n  assert.match(changelog,/minimal raw generation path/i);\n""", 'release changelog assertions')
write(path, text)

print('v0.3.5 post-review patch complete')
