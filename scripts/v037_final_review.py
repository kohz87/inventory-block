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
"""    root.durableRevision = id;\n    root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    compactRevisions(root);\n""",
"""    root.durableRevision = id;\n    root.durableLength = Array.isArray(context?.chat) ? context.chat.length : 0;\n    root.resolvedLength = root.durableLength;\n    compactRevisions(root);\n""",
'mark durable resolved boundary')

text=once(text,
"""    const sticky = [SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET].includes(revision?.source);\n""",
"""    const sticky = revision?.durable === true\n        || [SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET].includes(revision?.source);\n""",
'durable branch head sticky')

text=once(text,
"""                foundCheckpoint = true;\n                checkpoint.revision = currentRevision;\n""",
"""                if (checkpoint.durable === true) {\n                    const recovered = getRevision(root, currentRevision);\n                    if (recovered) recovered.durable = true;\n                    root.durableRevision = currentRevision;\n                    root.durableLength = index + 1;\n                }\n                foundCheckpoint = true;\n                checkpoint.revision = currentRevision;\n""",
'hydrate durable portable checkpoint')
write(path,text)

path='tests/v037-branch-anchor.test.js'
text=read(path)
text=once(text,
"""  const revision = createRevision(c, inv([item('Admin Set')]), { parent: 0, source: SOURCE.LLM });\n  assert.equal(root.durableRevision, 0);\n  markDurableRevision(c, revision);\n  assert.equal(root.durableRevision, revision);\n  assert.equal(getRevision(root, revision).durable, true);\n""",
"""  const revision = createRevision(c, inv([item('Admin Set')]), { parent: 0, source: SOURCE.LLM });\n  assert.equal(root.durableRevision, 0);\n  root.resolvedLength = 0;\n  markDurableRevision(c, revision);\n  assert.equal(root.durableRevision, revision);\n  assert.equal(root.resolvedLength, 1);\n  assert.equal(getRevision(root, revision).durable, true);\n  rememberBranchHead(c, revision);\n  assert.ok(Object.values(root.branchHeads).some(head => head.revision === revision && head.sticky === true));\n""",
'promoted durable boundary and sticky assertions')

text += """\n\ntest('durable portable checkpoint preserves promoted LLM durability during metadata rebuild', () => {\n  const original = ctx([assistant('admin state')]);\n  const root = ensureRoot(original);\n  const revision = createRevision(original, inv([item('Promoted Portable')]), { parent: 0, source: SOURCE.LLM });\n  markDurableRevision(original, revision);\n  attachMessageRevision(original, 0, { baseRevision: 0, revision, newUid: true, portable: true });\n  assert.equal(original.chat[0].extra[EXTRA_KEY].checkpoint.durable, true);\n\n  const rebuilt = ctx(structuredClone(original.chat));\n  ensureRoot(rebuilt);\n  const rebuiltRoot = ensureRoot(rebuilt);\n  assert.notEqual(rebuiltRoot.durableRevision, 0);\n  assert.equal(getRevision(rebuiltRoot, rebuiltRoot.durableRevision).durable, true);\n  assert.equal(getCurrentInventory(rebuilt).categories[0].items[0].name, 'Promoted Portable');\n});\n"""
write(path,text)

path='tests/v037-runtime-static.test.js'
text=read(path)
text=once(text,
"""  assert.match(state, /revision\\.durable === true/);\n""",
"""  assert.match(state, /revision\\.durable === true/);\n  assert.match(state, /root\\.resolvedLength = root\\.durableLength/);\n  assert.match(state, /revision\\?\\.durable === true/);\n""",
'final durable wiring assertions')
write(path,text)

path='CHANGELOG.md'
text=read(path)
text=once(text,
"- Forces history compaction to retain the durable revision and its portable checkpoint when available.\n",
"- Forces history compaction to retain durable revisions/checkpoints, keeps promoted admin branch heads sticky, and preserves durability when portable metadata is rebuilt.\n",
'changelog final durable recovery wording')
write(path,text)

print('v0.3.7 final source review hardening complete')
