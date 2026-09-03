from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

path='src/state.js'
text=read(path)
text=once(text,
"""        activeRevision: 0,\n        durableRevision: 0,\n        nextRevision: 1,\n""",
"""        activeRevision: 0,\n        durableRevision: 0,\n        durableLength: 0,\n        nextRevision: 1,\n""",
'durable length root field')

text=once(text,
"""    if (!Number.isInteger(root.durableRevision) || !root.revisions[String(root.durableRevision)]) {\n        const durableIds = Object.values(root.revisions)\n            .filter(revision => revision && Number.isInteger(revision.id) && isDurableSource(revision.source))\n            .map(revision => revision.id)\n            .sort((a, b) => a - b);\n        root.durableRevision = durableIds.at(-1) ?? 0;\n    }\n    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));\n""",
"""    if (!Number.isInteger(root.durableRevision) || !root.revisions[String(root.durableRevision)]) {\n        const durableIds = Object.values(root.revisions)\n            .filter(revision => revision && Number.isInteger(revision.id) && isDurableSource(revision.source))\n            .map(revision => revision.id)\n            .sort((a, b) => a - b);\n        root.durableRevision = durableIds.at(-1) ?? 0;\n    }\n    if (!Number.isInteger(root.durableLength) || root.durableLength < 0) {\n        root.durableLength = root.durableRevision === 0 ? 0 : (Array.isArray(context.chat) ? context.chat.length : 0);\n    }\n    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));\n""",
'migrate durable length')

text=once(text,
"""    root.durableRevision = id;\n    compactRevisions(root);\n    return id;\n}\n\nexport function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {\n    const root = ensureRoot(context);\n    const parentId = parent === null ? root.activeRevision : parent;\n    if (!getRevision(root, parentId)) throw new Error(`Cannot create inventory revision from missing parent ${parentId}.`);\n    return appendRevisionToRoot(root, state, { parent: parentId, source, note, portable: false });\n}\n""",
"""    root.durableRevision = id;\n    root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    compactRevisions(root);\n    return id;\n}\n\nexport function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {\n    const root = ensureRoot(context);\n    const parentId = parent === null ? root.activeRevision : parent;\n    if (!getRevision(root, parentId)) throw new Error(`Cannot create inventory revision from missing parent ${parentId}.`);\n    const revision = appendRevisionToRoot(root, state, { parent: parentId, source, note, portable: false });\n    if (isDurableSource(source)) root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    return revision;\n}\n""",
'capture durable length on explicit durable revisions')

text=once(text,
"""    if (inventoryEquals(previous, normalized)) {\n        root.durableRevision = root.activeRevision;\n        compactRevisions(root);\n        return root.activeRevision;\n    }\n""",
"""    if (inventoryEquals(previous, normalized)) {\n        root.durableRevision = root.activeRevision;\n        root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n        compactRevisions(root);\n        return root.activeRevision;\n    }\n""",
'capture durable length on no-op manual promotion')

text=once(text,
"""    // A resolution that collapses to revision 0 can mean the branch lost all Inventory anchors.\n    // Once an explicit seed/admin revision exists, use it only as an anti-empty fallback.\n    if (revision === 0 && allowDurableFallback && Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision)) {\n        revision = root.durableRevision;\n    }\n""",
"""    const durableRevision = Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision)\n        ? root.durableRevision\n        : null;\n    const durableLength = Number.isInteger(root.durableLength) && root.durableLength >= 0 ? root.durableLength : 0;\n    if (allowDurableFallback && durableRevision !== null) {\n        // Prefix reconstruction may use a durable state only if that state already existed\n        // by the requested boundary. This prevents a later manual edit leaking backward.\n        const missingKnownBaseline = revision === 0 && durableLength <= end;\n        // Full active-branch resolution may carry a later durable admin state across\n        // deletion(s), but only when the surviving revision is its ancestor. Same-length\n        // swipe changes therefore remain branch-local.\n        const deletedDurableAnchor = commitActive\n            && end < durableLength\n            && (revision === 0 || revisionDescendsFrom(root, durableRevision, revision));\n        if (missingKnownBaseline || deletedDurableAnchor) revision = durableRevision;\n    }\n""",
'length-aware durable fallback')
write(path,text)

path='src/history.js'
text=read(path)
text=once(text,
"""    const chat = Array.isArray(context.chat) ? context.chat : [];\n    if (chat.length) {\n""",
"""    const chat = Array.isArray(context.chat) ? context.chat : [];\n    root.durableLength = chat.length;\n    if (chat.length) {\n""",
'clear history durable length')
write(path,text)

path='tests/v037-branch-anchor.test.js'
text=read(path)
text += """\n\ntest('manual durable edit survives tail deletion even when an older non-empty revision survives', () => {\n  const c = ctx([assistant('start'), user('find loot'), assistant('loot found'), user('note inventory'), assistant('tail')]);\n  const root = ensureRoot(c);\n  const seed = createRevision(c, inv([item('Coin Pouch', '1', '100 Gold')]), { parent: 0, source: SOURCE.SEED });\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: seed, newUid: true, portable: true });\n  const loot = createRevision(c, inv([item('Coin Pouch', '1', '100 Gold'), item('Gem')]), { parent: seed, source: SOURCE.LLM });\n  attachMessageRevision(c, 2, { baseRevision: seed, revision: loot, newUid: true, portable: true });\n  const manual = commitManualState(c, inv([item('Coin Pouch', '1', '100 Gold'), item('Gem'), item('Map')]), { source: SOURCE.MANUAL });\n  assert.equal(root.durableRevision, manual);\n  assert.equal(root.durableLength, 5);\n  c.chat.pop();\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), manual);\n  assert.ok(getCurrentInventory(c).categories[0].items.some(x => x.name === 'Map'));\n});\n\ntest('prefix resolution never pulls a later durable manual edit backward', () => {\n  const c = ctx([assistant('start'), user('question'), assistant('answer')]);\n  const root = ensureRoot(c);\n  const seed = createRevision(c, inv([item('Torch', '2')]), { parent: 0, source: SOURCE.SEED });\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: seed, newUid: true, portable: true });\n  const manual = commitManualState(c, inv([item('Torch', '2'), item('Late Map')]), { source: SOURCE.MANUAL });\n  assert.equal(root.durableRevision, manual);\n  assert.equal(root.durableLength, 3);\n  assert.equal(resolveRevisionBeforeMessage(c, 2), seed);\n});\n"""
write(path,text)

path='tests/v037-history-anchor.test.js'
text=read(path)
text=once(text,
"""  assert.equal(root.durableRevision,0);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name,'Coin Pouch');\n""",
"""  assert.equal(root.durableRevision,0);\n  assert.equal(root.durableLength,1);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name,'Coin Pouch');\n""",
'clear history durable length test')
write(path,text)

path='tests/v037-runtime-static.test.js'
text=read(path)
text=once(text,
"""  assert.match(state, /revision === 0 && allowDurableFallback/);\n""",
"""  assert.match(state, /durableLength <= end/);\n  assert.match(state, /end < durableLength/);\n""",
'runtime durable length assertions')
write(path,text)

path='CHANGELOG.md'
text=read(path)
text=once(text,
"- Uses the durable revision only as an anti-empty fallback, so valid swipe branches keep their own state while missing/deleted anchors can no longer collapse an established inventory to revision 0.\n",
"- Tracks the durable revision with its chat-length boundary: valid swipe branches keep their own state, later manual edits never leak backward, and deleting an admin anchor carries that state forward instead of silently rolling it away.\n",
'changelog durable length wording')
text=text.replace('- Keeps ordinary LLM inventory changes above that floor branch-sensitive, so deleting a purchase/loot response still rolls that narrative change back.\n', '- Keeps ordinary LLM inventory changes branch-sensitive, so deleting a purchase/loot response still rolls that narrative change back.\n', 1)
write(path,text)

print('v0.3.7 durable anchor length hardening complete')
