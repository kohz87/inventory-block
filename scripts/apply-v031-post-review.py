from pathlib import Path


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


ui_path = 'src/ui.js'
text = read(ui_path)
old_compare = """    const beforeEmpty = new Map(beforeInventory.categories.filter(category => !category.items.length).map(category => [identityKey(category.name), category.name]));
    const afterEmpty = new Map(afterInventory.categories.filter(category => !category.items.length).map(category => [identityKey(category.name), category.name]));
    const categoriesAdded = [...afterEmpty].filter(([key]) => !beforeEmpty.has(key)).map(([, name]) => name);
    const categoriesRemoved = [...beforeEmpty].filter(([key]) => !afterEmpty.has(key)).map(([, name]) => name);
"""
new_compare = """    const beforeEmpty = new Set(beforeInventory.categories.filter(category => !category.items.length).map(category => category.name));
    const afterEmpty = new Set(afterInventory.categories.filter(category => !category.items.length).map(category => category.name));
    const categoriesAdded = [...afterEmpty].filter(name => !beforeEmpty.has(name));
    const categoriesRemoved = [...beforeEmpty].filter(name => !afterEmpty.has(name));
"""
if old_compare in text:
    text = text.replace(old_compare, new_compare, 1)
elif new_compare not in text:
    raise RuntimeError('empty-category comparison anchor missing')

old_snapshot = """    const total = itemCount(inventory);
    if (!total) {
"""
new_snapshot = """    if (!inventory.categories.length) {
"""
if old_snapshot in text:
    text = text.replace(old_snapshot, new_snapshot, 1)
elif new_snapshot not in text:
    raise RuntimeError('history snapshot empty-category anchor missing')
write(ui_path, text)

resources_path = 'tests/resources.test.js'
text = read(resources_path)
duplicate = "  assert.match(prompt, /adjust_resource/);\n  assert.match(prompt, /adjust_resource/);\n"
while duplicate in text:
    text = text.replace(duplicate, "  assert.match(prompt, /adjust_resource/);\n")
write(resources_path, text)

history_path = 'tests/history.test.js'
text = read(history_path)
category_assertions = "  assert.deepEqual(diff.categoriesAdded, []);\n  assert.deepEqual(diff.categoriesRemoved, []);\n"
while category_assertions + category_assertions in text:
    text = text.replace(category_assertions + category_assertions, category_assertions)
write(history_path, text)

deep_path = 'tests/deep-audit.test.js'
text = read(deep_path)
if "import fs from 'node:fs';" not in text:
    text = text.replace("import assert from 'node:assert/strict';\n", "import assert from 'node:assert/strict';\nimport fs from 'node:fs';\n", 1)
if "empty-category comparison detects case-only rename" not in text:
    text += r'''

test('empty-category comparison detects case-only rename', () => {
  const before = { categories: [{ name: 'Pack', items: [] }] };
  const after = { categories: [{ name: 'pack', items: [] }] };
  const diff = compareInventoryStates(before, after);
  assert.deepEqual(diff.categoriesRemoved, ['Pack']);
  assert.deepEqual(diff.categoriesAdded, ['pack']);
});
'''
if "history snapshot source keeps empty categories visible" not in text:
    text += r'''

test('history snapshot source keeps empty categories visible', () => {
  const source = fs.readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
  assert.match(source, /if \(!inventory\.categories\.length\)/);
  assert.doesNotMatch(source, /const total = itemCount\(inventory\);\s*if \(!total\)/);
});
'''
write(deep_path, text)

print('v0.3.1 post-review corrections applied')
