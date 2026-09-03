from pathlib import Path

ROOT=Path('.')
def read(path): return (ROOT/path).read_text()
def write(path,text): (ROOT/path).write_text(text)
def once(text,old,new,label):
    count=text.count(old)
    if count!=1: raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old,new,1)

# Prefer the base shared by sibling swipes before falling back to prefix reconstruction.
path='index.js'
text=read(path)
needle="""function onMessageSwiped(messageId) {\n"""
helper="""function swipeBaseRevision(ctx, message, messageId) {\n    const root = ensureRoot(ctx);\n    const candidates = new Set();\n    const collect = meta => {\n        if (Number.isInteger(meta?.baseRevision) && getRevision(root, meta.baseRevision)) candidates.add(meta.baseRevision);\n    };\n    collect(activeMessageMeta(message));\n    if (Array.isArray(message?.swipe_info)) {\n        for (const info of message.swipe_info) collect(info?.extra?.[EXTRA_KEY]);\n    }\n    if (candidates.size === 1) return candidates.values().next().value;\n    return resolveRevisionBeforeMessage(ctx, messageId);\n}\n\nfunction onMessageSwiped(messageId) {\n"""
text=once(text,needle,helper,'swipe base helper')
text=once(text,
"""                    const baseRevision = resolveRevisionBeforeMessage(ctx, id);\n                    attachMessageRevision(ctx, id, { baseRevision, revision: baseRevision, newUid: true, portable: false });\n""",
"""                    const baseRevision = swipeBaseRevision(ctx, message, id);\n                    attachMessageRevision(ctx, id, { baseRevision, revision: baseRevision, newUid: true, portable: false });\n""",
'use sibling swipe base')
write(path,text)

# Clear History rebases current inventory onto revision 0, so durableRevision must rebase too.
path='src/history.js'
text=read(path)
text=once(text,
"""    root.activeRevision = 0;\n    root.nextRevision = 1;\n""",
"""    root.activeRevision = 0;\n    root.durableRevision = 0;\n    root.nextRevision = 1;\n""",
'clear history durable reset')
write(path,text)

# Tighten the resolver comment produced by the compatibility correction.
path='src/state.js'
text=read(path)
text=once(text,
"""    // Revision 0 is the pristine empty state. Once an explicit seed/admin revision exists,\n    // missing or deleted metadata must never make a branch appear as if inventory never existed.\n""",
"""    // A resolution that collapses to revision 0 can mean the branch lost all Inventory anchors.\n    // Once an explicit seed/admin revision exists, use it only as an anti-empty fallback.\n""",
'fallback comment')
write(path,text)

# Add focused post-review regressions.
path='tests/v037-history-anchor.test.js'
write(path,"""import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { clearInventoryHistory } from '../src/history.js';\nimport { commitManualState, ensureRoot, getCurrentInventory, invalidateLineageCache, resolveActiveRevision } from '../src/state.js';\nimport { SOURCE } from '../src/constants.js';\n\nconst item=(name,quantity='1',remark='')=>({name,quantity,remark});\nconst inv=items=>({categories:[{name:'General',items}]});\nconst ctx=()=>({chat:[{is_user:false,is_system:false,mes:'tail',extra:{}}],chatMetadata:{}});\n\ntest('Clear History rebases durableRevision and survives later tail deletion',()=>{\n  const c=ctx();\n  commitManualState(c,inv([item('Coin Pouch','1','100 Gold')]),{source:SOURCE.MANUAL});\n  clearInventoryHistory(c);\n  const root=ensureRoot(c);\n  assert.equal(root.activeRevision,0);\n  assert.equal(root.durableRevision,0);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name,'Coin Pouch');\n  c.chat.length=0;\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c),0);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].remark,'100 Gold');\n});\n""")

path='tests/v037-runtime-static.test.js'
text=read(path)
text=once(text,
"""  assert.match(fn, /resolveRevisionBeforeMessage\\(ctx, id\\)/);\n  assert.ok(fn.indexOf('resolveRevisionBeforeMessage(ctx, id)') < fn.indexOf('resolveActiveRevision(ctx)'));\n  assert.match(fn, /baseRevision, revision: baseRevision/);\n""",
"""  assert.match(index, /function swipeBaseRevision/);\n  assert.match(fn, /swipeBaseRevision\\(ctx, message, id\\)/);\n  assert.ok(fn.indexOf('swipeBaseRevision(ctx, message, id)') < fn.indexOf('resolveActiveRevision(ctx)'));\n  assert.match(fn, /baseRevision, revision: baseRevision/);\n""",
'runtime sibling-base assertions')
write(path,text)

print('v0.3.7 post-review hardening complete')
