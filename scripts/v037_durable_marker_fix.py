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
"""    root.revisions[String(id)] = {\n        id, parent, source: source || SOURCE.PORTABLE, note: cleanText(note),\n        createdAt: new Date().toISOString(), state: normalized, portable: Boolean(portable),\n    };\n""",
"""    root.revisions[String(id)] = {\n        id, parent, source: source || SOURCE.PORTABLE, note: cleanText(note),\n        createdAt: new Date().toISOString(), state: normalized, portable: Boolean(portable),\n        durable: isDurableSource(source),\n    };\n""",
'persist durable marker on revision')

text=once(text,
"""    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) root.activeRevision = 0;\n    if (!Number.isInteger(root.durableRevision) || !root.revisions[String(root.durableRevision)]) {\n        const durableIds = Object.values(root.revisions)\n            .filter(revision => revision && Number.isInteger(revision.id) && isDurableSource(revision.source))\n            .map(revision => revision.id)\n            .sort((a, b) => a - b);\n        root.durableRevision = durableIds.at(-1) ?? 0;\n    }\n""",
"""    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) root.activeRevision = 0;\n    for (const revision of Object.values(root.revisions)) {\n        if (revision && isDurableSource(revision.source)) revision.durable = true;\n    }\n    if (!Number.isInteger(root.durableRevision) || !root.revisions[String(root.durableRevision)]) {\n        const durableIds = Object.values(root.revisions)\n            .filter(revision => revision && Number.isInteger(revision.id) && revision.durable === true)\n            .map(revision => revision.id)\n            .sort((a, b) => a - b);\n        root.durableRevision = durableIds.at(-1) ?? 0;\n    }\n""",
'migrate durable markers')

text=once(text,
"""    root.durableRevision = id;\n    root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    compactRevisions(root);\n""",
"""    const revision = getRevision(root, id);\n    revision.durable = true;\n    root.durableRevision = id;\n    root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    compactRevisions(root);\n""",
'mark revision record durable')

text=once(text,
"""    if (inventoryEquals(previous, normalized)) {\n        root.durableRevision = root.activeRevision;\n        root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n        root.resolvedLength = root.durableLength;\n""",
"""    if (inventoryEquals(previous, normalized)) {\n        const active = getRevision(root, root.activeRevision);\n        if (active) active.durable = true;\n        root.durableRevision = root.activeRevision;\n        root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n        root.resolvedLength = root.durableLength;\n""",
'no-op manual durable marker')

text=once(text,
"""        if (isDurableSource(revision.source)) return cursor;\n""",
"""        if (revision.durable === true || isDurableSource(revision.source)) return cursor;\n""",
'branch durable marker lookup')

text=once(text,
"""    const checkpoint = {\n        packed: packInventory(revision.state),\n        revision: revisionId,\n        source: source || revision.source || SOURCE.PORTABLE,\n""",
"""    const checkpoint = {\n        packed: packInventory(revision.state),\n        revision: revisionId,\n        source: source || revision.source || SOURCE.PORTABLE,\n        durable: revision.durable === true,\n""",
'portable durable marker')

text=once(text,
"""        updateCheckpointReference(checkpoint, revision, data, index);\n        return revision;\n""",
"""        if (checkpoint.durable === true) {\n            const recovered = getRevision(root, revision);\n            if (recovered) recovered.durable = true;\n            root.durableRevision = revision;\n            root.durableLength = index + 1;\n        }\n        updateCheckpointReference(checkpoint, revision, data, index);\n        return revision;\n""",
'recover durable checkpoint marker')
write(path,text)

path='src/history.js'
text=read(path)
text=once(text,
"""            state: current,\n            portable: true,\n""",
"""            state: current,\n            portable: true,\n            durable: true,\n""",
'clear history durable revision marker')
write(path,text)

path='tests/v037-branch-anchor.test.js'
text=read(path)
text=once(text,
"""  markDurableRevision(c, revision);\n  assert.equal(root.durableRevision, revision);\n  c.chat.length = 0;\n""",
"""  markDurableRevision(c, revision);\n  assert.equal(root.durableRevision, revision);\n  assert.equal(getRevision(root, revision).durable, true);\n  c.chat.length = 0;\n""",
'explicit promoted durable marker assertion')
text += """\n\ntest('deletion preserves an explicitly promoted LLM durable revision on the selected swipe', () => {\n  const message = assistant('branch zero');\n  message.swipes = ['branch zero', 'branch one'];\n  message.swipe_info = [{}, {}];\n  message.swipe_id = 0;\n  const c = ctx([message]);\n  const root = ensureRoot(c);\n\n  const branch0 = createRevision(c, inv([item('Promoted Zero')]), { parent: 0, source: SOURCE.LLM });\n  markDurableRevision(c, branch0);\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: branch0, newUid: true, portable: true });\n  message.swipe_info[0] = { extra: structuredClone(message.extra) };\n\n  message.swipe_id = 1;\n  message.mes = 'branch one';\n  message.extra = {};\n  root.activeRevision = 0;\n  const branch1 = createRevision(c, inv([item('Promoted One')]), { parent: 0, source: SOURCE.LLM });\n  markDurableRevision(c, branch1);\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: branch1, newUid: true, portable: true });\n  message.swipe_info[1] = { extra: structuredClone(message.extra) };\n\n  message.swipe_id = 0;\n  message.mes = 'branch zero';\n  message.extra = structuredClone(message.swipe_info[0].extra);\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), branch0);\n  c.chat.pop();\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), branch0);\n});\n"""
write(path,text)

path='tests/v037-runtime-static.test.js'
text=read(path)
text=once(text,
"""  assert.match(state, /nearestDurableAncestor/);\n""",
"""  assert.match(state, /nearestDurableAncestor/);\n  assert.match(state, /revision\\.durable === true/);\n""",
'durable marker static assertion')
write(path,text)

path='CHANGELOG.md'
text=read(path)
text=once(text,
"- Adds a chat-level durable inventory revision for starting seeds and explicit administrative state (manual edits, imports, restores, resets, and broad OOC inventory administration).\n",
"- Adds durable revision markers for starting seeds and explicit administrative state (manual edits, imports, restores, resets, and broad OOC inventory administration), including LLM revisions explicitly promoted by an admin reconciliation.\n",
'changelog durable marker wording')
write(path,text)

print('v0.3.7 durable revision marker correction complete')
