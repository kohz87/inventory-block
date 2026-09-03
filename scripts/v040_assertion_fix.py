from pathlib import Path

ROOT = Path('.')

def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

path = 'tests/v035-manual-reconcile.test.js'
text = read(path)
text = once(
    text,
    "assert.match(index, /legacy response already carries an Inventory state change/i);",
    "assert.match(index, /response already carries an Inventory state change/i);",
    'manual recovery wording assertion',
)
write(path, text)

path = 'tests/v037-runtime-static.test.js'
text = read(path)
text = once(
    text,
    "assert.match(index, /session\\.replaceCapability\\) markDurableRevision/);",
    "assert.match(index, /session\\?\\.replaceCapability\\) markDurableRevision/);",
    'optional chaining durable admin assertion',
)
write(path, text)

print('v0.4.0 stale assertion fixes complete')
