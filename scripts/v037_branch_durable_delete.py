from pathlib import Path

ROOT=Path('.')
def read(path): return (ROOT/path).read_text()
def write(path,text): (ROOT/path).write_text(text)
def once(text,old,new,label):
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old,new,1)

path='src/state.js'
text=read(path)
text=once(text,
"""        durableRevision: 0,\n        durableLength: 0,\n        nextRevision: 1,\n""",
"""        durableRevision: 0,\n        durableLength: 0,\n        resolvedLength: 0,\n        nextRevision: 1,\n""",
'active resolved length root field')

text=once(text,
"""    if (!Number.isInteger(root.durableLength) || root.durableLength < 0) {\n        root.durableLength = root.durableRevision === 0 ? 0 : (Array.isArray(context.chat) ? context.chat.length : 0);\n    }\n    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));\n""",
"""    if (!Number.isInteger(root.durableLength) || root.durableLength < 0) {\n        root.durableLength = root.durableRevision === 0 ? 0 : (Array.isArray(context.chat) ? context.chat.length : 0);\n    }\n    if (!Number.isInteger(root.resolvedLength) || root.resolvedLength < 0) {\n        root.resolvedLength = Array.isArray(context.chat) ? context.chat.length : 0;\n    }\n    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));\n""",
'migrate resolved length')

text=once(text,
"""    const revision = appendRevisionToRoot(root, state, { parent: parentId, source, note, portable: false });\n    if (isDurableSource(source)) root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    return revision;\n""",
"""    const revision = appendRevisionToRoot(root, state, { parent: parentId, source, note, portable: false });\n    root.resolvedLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    if (isDurableSource(source)) root.durableLength = root.resolvedLength;\n    return revision;\n""",
'capture resolved length on revision creation')

text=once(text,
"""    if (inventoryEquals(previous, normalized)) {\n        root.durableRevision = root.activeRevision;\n        root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n        compactRevisions(root);\n""",
"""    if (inventoryEquals(previous, normalized)) {\n        root.durableRevision = root.activeRevision;\n        root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n        root.resolvedLength = root.durableLength;\n        compactRevisions(root);\n""",
'no-op manual resolved length')

text=once(text,
"""function expectedMetaHash(context, index, meta, data, legacyFingerprints) {\n""",
"""function nearestDurableAncestor(root, revisionId) {\n    const seen = new Set();\n    let cursor = revisionId;\n    while (Number.isInteger(cursor) && !seen.has(cursor)) {\n        seen.add(cursor);\n        const revision = getRevision(root, cursor);\n        if (!revision) return null;\n        if (isDurableSource(revision.source)) return cursor;\n        cursor = revision.parent;\n    }\n    return null;\n}\n\nfunction expectedMetaHash(context, index, meta, data, legacyFingerprints) {\n""",
'nearest branch durable helper')

text=once(text,
"""    const legacyPrefix = length => legacyHashLineage(legacyFingerprints.slice(0, length));\n    const previousActive = root.activeRevision;\n\n    let bestHead = null;\n""",
"""    const legacyPrefix = length => legacyHashLineage(legacyFingerprints.slice(0, length));\n    const previousActive = root.activeRevision;\n    const previousLength = Number.isInteger(root.resolvedLength) && root.resolvedLength >= 0 ? root.resolvedLength : end;\n\n    let bestHead = null;\n""",
'capture previous resolved length')

old="""    const durableRevision = Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision)\n        ? root.durableRevision\n        : null;\n    const durableLength = Number.isInteger(root.durableLength) && root.durableLength >= 0 ? root.durableLength : 0;\n    if (allowDurableFallback && durableRevision !== null) {\n        // Prefix reconstruction may use a durable state only if that state already existed\n        // by the requested boundary. This prevents a later manual edit leaking backward.\n        const missingKnownBaseline = revision === 0 && durableLength <= end;\n        // Full active-branch resolution may carry a later durable admin state across\n        // deletion(s), but only when the surviving revision is its ancestor. Same-length\n        // swipe changes therefore remain branch-local.\n        const deletedDurableAnchor = commitActive\n            && end < durableLength\n            && (revision === 0 || revisionDescendsFrom(root, durableRevision, revision));\n        if (missingKnownBaseline || deletedDurableAnchor) revision = durableRevision;\n    }\n\n    if (commitActive) {\n        root.activeRevision = revision;\n"""
new="""    // Deleting messages shortens the active timeline. Preserve the nearest explicit\n    // seed/admin ancestor of the branch that was active immediately before deletion,\n    // but only if normal reconstruction landed on that ancestor or one of its parents.\n    // This is branch-specific: switching swipes at the same length never triggers it.\n    const branchDurable = commitActive && end < previousLength\n        ? nearestDurableAncestor(root, previousActive)\n        : null;\n    if (branchDurable !== null\n        && (revision === 0 || revision === branchDurable || revisionDescendsFrom(root, branchDurable, revision))) {\n        revision = branchDurable;\n    }\n\n    const durableRevision = Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision)\n        ? root.durableRevision\n        : null;\n    const durableLength = Number.isInteger(root.durableLength) && root.durableLength >= 0 ? root.durableLength : 0;\n    if (allowDurableFallback && durableRevision !== null && branchDurable === null) {\n        // Generic anti-empty recovery is allowed only if the durable state already\n        // existed by this boundary. Later admin changes never leak backward.\n        if (revision === 0 && durableLength <= end) revision = durableRevision;\n    }\n\n    if (commitActive) {\n        root.activeRevision = revision;\n        root.resolvedLength = end;\n"""
text=once(text,old,new,'branch-specific deletion carry-forward')

text=once(text,
"""    if (foundCheckpoint) {\n        root.activeRevision = currentRevision;\n        const key = data.prefixKeys.at(-1) ?? 'root';\n""",
"""    if (foundCheckpoint) {\n        root.activeRevision = currentRevision;\n        root.resolvedLength = chat.length;\n        const key = data.prefixKeys.at(-1) ?? 'root';\n""",
'hydrated resolved length')
write(path,text)

path='src/history.js'
text=read(path)
text=once(text,
"""    root.durableLength = chat.length;\n    if (chat.length) {\n""",
"""    root.durableLength = chat.length;\n    root.resolvedLength = chat.length;\n    if (chat.length) {\n""",
'clear history resolved length')
write(path,text)

path='tests/v037-branch-anchor.test.js'
text=read(path)
text += """\n\ntest('deleting the selected swipe preserves that swipe durable state, not a newer sibling durable state', () => {\n  const message = assistant('swipe zero');\n  message.swipes = ['swipe zero', 'swipe one'];\n  message.swipe_info = [{}, {}];\n  message.swipe_id = 0;\n  const c = ctx([message]);\n  const root = ensureRoot(c);\n  const swipe0 = commitManualState(c, inv([item('Branch Zero')]), { source: SOURCE.MANUAL });\n  message.swipe_id = 1;\n  message.mes = 'swipe one';\n  message.extra = structuredClone(message.swipe_info[0]?.extra ?? message.extra);\n  root.activeRevision = swipe0;\n  const swipe1 = commitManualState(c, inv([item('Branch One')]), { source: SOURCE.MANUAL });\n  message.swipe_info[1] = { extra: structuredClone(message.extra) };\n  assert.equal(root.durableRevision, swipe1);\n  message.swipe_id = 0;\n  message.mes = 'swipe zero';\n  message.extra = structuredClone(message.swipe_info[0].extra);\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), swipe0);\n  assert.equal(root.resolvedLength, 1);\n  c.chat.pop();\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), swipe0);\n});\n"""
write(path,text)

path='tests/v037-history-anchor.test.js'
text=read(path)
text=once(text,
"""  assert.equal(root.durableLength,1);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name,'Coin Pouch');\n""",
"""  assert.equal(root.durableLength,1);\n  assert.equal(root.resolvedLength,1);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name,'Coin Pouch');\n""",
'clear history resolved length test')
write(path,text)

path='tests/v037-runtime-static.test.js'
text=read(path)
text=once(text,
"""  assert.match(state, /durableLength <= end/);\n  assert.match(state, /end < durableLength/);\n""",
"""  assert.match(state, /nearestDurableAncestor/);\n  assert.match(state, /end < previousLength/);\n  assert.match(state, /durableLength <= end/);\n""",
'branch deletion static assertions')
write(path,text)

path='CHANGELOG.md'
text=read(path)
text=once(text,
"- Tracks the durable revision with its chat-length boundary: valid swipe branches keep their own state, later manual edits never leak backward, and deleting an admin anchor carries that state forward instead of silently rolling it away.\n",
"- Tracks durable state boundaries and the last resolved branch length: valid swipe branches keep their own state, later manual edits never leak backward, and deletion carries forward the nearest seed/admin ancestor of the branch that was actually active.\n",
'changelog branch-specific deletion wording')
write(path,text)

print('v0.3.7 branch-specific durable deletion hardening complete')
