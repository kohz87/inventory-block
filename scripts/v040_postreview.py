from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

# Successful foreground controls establish a safe manual-recovery boundary.
path = 'index.js'
text = read(path)
text = once(
    text,
    """        const concurrentConflict = mutationConflict || timelineConflict;\n\n        let acceptedState = result.state;\n""",
    """        const concurrentConflict = mutationConflict || timelineConflict;\n        const foregroundControlAccepted = Boolean(\n            pendingApplies && session?.promptInjected && result.hadControl && warnings.length === 0 && !concurrentConflict\n        );\n\n        let acceptedState = result.state;\n""",
    'foreground accepted-control boundary flag',
)
text = once(
    text,
    """        scheduleAlternateSwipeMetadataCleanup(chatId, id, activeSwipeId, attachedMeta?.uid);\n        root.activeRevision = acceptedRevision;\n        rememberBranchHead(ctx, acceptedRevision);\n""",
    """        scheduleAlternateSwipeMetadataCleanup(chatId, id, activeSwipeId, attachedMeta?.uid);\n        if (foregroundControlAccepted) stampReconciliation(ctx, id, acceptedRevision);\n        root.activeRevision = acceptedRevision;\n        rememberBranchHead(ctx, acceptedRevision);\n""",
    'stamp accepted foreground control',
)
write(path, text)

# A reconciliation boundary belongs to the exact assistant/swipe identity.
path = 'src/state.js'
text = read(path)
text = once(
    text,
    """    const preserved = { ...current };\n    if (newUid) delete preserved.checkpoint;\n    const uid = newUid || !current.uid ? randomUid() : current.uid;\n""",
    """    const preserved = { ...current };\n    if (newUid) {\n        delete preserved.checkpoint;\n        delete preserved.reconcile;\n    }\n    const uid = newUid || !current.uid ? randomUid() : current.uid;\n""",
    'clear stale reconciliation stamp with new uid',
)
write(path, text)

# Strengthen v0.4.0 regression coverage.
path = 'tests/v040-one-pass.test.js'
text = read(path)
text += """\n\ntest('successful trusted foreground controls stamp the cleaned response for safe Continue recovery', () => {\n  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n  assert.match(index, /const foregroundControlAccepted = Boolean\\(/);\n  assert.match(index, /pendingApplies && session\\?\\.promptInjected && result\\.hadControl/);\n  assert.match(index, /warnings\\.length === 0 && !concurrentConflict/);\n  assert.match(index, /if \\(foregroundControlAccepted\\) stampReconciliation\\(ctx, id, acceptedRevision\\)/);\n  const messageAssign = index.indexOf('message.mes = result.cleanedText');\n  const stamp = index.indexOf('if (foregroundControlAccepted) stampReconciliation(ctx, id, acceptedRevision)');\n  assert.ok(messageAssign >= 0 && stamp > messageAssign, 'stamp must hash the cleaned story after machine transport is stripped');\n});\n\ntest('missing or rejected foreground controls remain unstamped and manually recoverable', () => {\n  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n  const start = index.indexOf('const foregroundControlAccepted = Boolean(');\n  const end = index.indexOf('let acceptedState = result.state', start);\n  const guard = index.slice(start, end);\n  assert.match(guard, /result\\.hadControl/);\n  assert.match(guard, /warnings\\.length === 0/);\n  assert.match(guard, /!concurrentConflict/);\n});\n\ntest('new assistant or swipe identity clears any stale reconciliation boundary', () => {\n  const state = fs.readFileSync(new URL('../src/state.js', import.meta.url), 'utf8');\n  const start = state.indexOf('export function attachMessageRevision');\n  const end = state.indexOf('function attachCurrentRevisionToTail', start);\n  const block = state.slice(start, end);\n  assert.match(block, /if \\(newUid\\) \\{/);\n  assert.match(block, /delete preserved\\.checkpoint/);\n  assert.match(block, /delete preserved\\.reconcile/);\n});\n"""
write(path, text)

path = 'CHANGELOG.md'
text = read(path)
text = once(
    text,
    '- Keeps **Reconcile Latest Response** and `/inventory-reconcile` as explicit `generateRaw` recovery tools when a foreground update was omitted or malformed.\n',
    '- Keeps **Reconcile Latest Response** and `/inventory-reconcile` as explicit `generateRaw` recovery tools when a foreground update was omitted or malformed; successful foreground controls stamp the cleaned-text boundary so a later Continue can recover only its new suffix without double-counting earlier events.\n',
    'changelog recovery boundary',
)
write(path, text)

print('v0.4.0 post-review reconciliation boundary hardening complete')
