from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

path = 'index.js'
text = read(path)
text = once(
    text,
    "if (!concurrentConflict && warnings.length === 0 && pendingApplies && session?.replaceCapability) markDurableRevision(ctx, acceptedRevision);",
    "if (foregroundControlAccepted && session?.replaceCapability) markDurableRevision(ctx, acceptedRevision);",
    'foreground admin durable promotion guard',
)
write(path, text)

path = 'tests/v037-runtime-static.test.js'
text = read(path)
text = once(
    text,
    "assert.match(index, /session\\?\\.replaceCapability\\) markDurableRevision/);",
    "assert.match(index, /foregroundControlAccepted && session\\?\\.replaceCapability\\) markDurableRevision/);",
    'durable runtime static assertion',
)
write(path, text)

path = 'tests/v040-one-pass.test.js'
text = read(path)
text += """\n\ntest('admin durability is promoted only after a trusted foreground control is accepted', () => {\n  const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\n  assert.match(index, /if \\(foregroundControlAccepted && session\\?\\.replaceCapability\\) markDurableRevision\\(ctx, acceptedRevision\\)/);\n  assert.doesNotMatch(index, /if \\(!concurrentConflict && warnings\\.length === 0 && pendingApplies && session\\?\\.replaceCapability\\) markDurableRevision/);\n});\n"""
write(path, text)

path = 'CHANGELOG.md'
text = read(path)
text = once(
    text,
    '- Keeps v0.3.7 durable branch anchors, swipe/deletion rollback semantics, streaming UI suspension, and backend negative-resource guards unchanged.\n',
    '- Keeps v0.3.7 durable branch anchors, swipe/deletion rollback semantics, streaming UI suspension, and backend negative-resource guards; an OOC/admin turn promotes durability only after its foreground control is actually accepted (or after explicit manual recovery).\n',
    'changelog durable promotion wording',
)
write(path, text)

print('v0.4.0 accepted-control durability guard complete')
