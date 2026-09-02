from pathlib import Path
import json

protocol = Path('src/protocol.js')
text = protocol.read_text()
old = 'Other required response blocks may appear before or after it. The terminal period after the HTML comment is mandatory:\\n'
new = 'Other required response blocks may appear before or after it. A terminal period after the HTML comment is preferred for SillyTavern sentence-trimming compatibility, but a complete comment without it is accepted:\\n'
if old not in text:
    raise SystemExit('prompt sentinel wording anchor not found')
text = text.replace(old, new, 1)
old = '''    const errors = [];
    if (!span.hasSentinel) errors.push('Inventory control is missing its required terminal period.');
    const validEnvelope = errors.length === 0;
    return {
        cleanedText: removeControlSpans(source, [span], { trimProtocolSpace: validEnvelope }),
        body: span.body,
        hadControl: true,
        errors,
    };'''
new = '''    return {
        cleanedText: removeControlSpans(source, [span], { trimProtocolSpace: true }),
        body: span.body,
        hadControl: true,
        errors: [],
    };'''
if old not in text:
    raise SystemExit('sentinel rejection anchor not found')
text = text.replace(old, new, 1)
protocol.write_text(text)

tests = Path('tests/protocol.test.js')
text = tests.read_text()
extra = r'''

test('complete Inventory control without terminal period is accepted', () => {
  const source = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"add_item","category":"General","name":"Torch","quantity":"1","remark":""}]} -->';
  const result = consumeInventoryUpdates(source, inv([]));
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].name, 'Torch');
  assert.equal(result.cleanedText, '');
});

test('periodless complete control may be followed by Megumin blocks', () => {
  const world = '<WorldState>\nDay 5 | Night\n</WorldState>';
  const source = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"add_item","category":"General","name":"Rope","quantity":"1","remark":""}]} -->\n\n' + world;
  const result = consumeInventoryUpdates(source, inv([]));
  assert.deepEqual(result.errors, []);
  assert.equal(result.changed, true);
  assert.equal(result.state.categories[0].items[0].name, 'Rope');
  assert.equal(result.cleanedText, '\n\n' + world);
});

test('truncated control is still rejected when no comment close exists', () => {
  const source = '<!-- INVENTORY_BLOCK_UPDATE {"mode":"patch","ops":[{"op":"add_item","category":"General","name":"Torch","quantity":"1","remark":""}]}' + '\n\nAfter.';
  const result = consumeInventoryUpdates(source, inv([]));
  assert.equal(result.changed, false);
  assert.match(result.errors.join(' '), /truncated/i);
  assert.match(result.cleanedText, /After\.$/);
});
'''
if "complete Inventory control without terminal period is accepted" not in text:
    text += extra
tests.write_text(text)

fuzz = Path('tests/hardpass-fuzz.mjs')
text = fuzz.read_text()
anchor = "for(let i=0;i<500;i++){\n  const state={categories:[{name:`${pick(i)}-${i}`,items:[{name:`${pick(i+1)}|${i}`,quantity:'1',remark:`${pick(i+2)}<&>${i}`}]}]};"
insert = """for(let i=0;i<800;i++){\n  const payload={mode:'patch',ops:[{op:'add_item',category:'General',name:`NoDot${i}`,quantity:'1',remark:''}]};\n  const c=`<!-- INVENTORY_BLOCK_UPDATE ${JSON.stringify(payload)} -->`;\n  const r=consumeInventoryUpdates(c,{categories:[]});\n  assert.deepEqual(r.errors,[]);\n  assert.equal(r.state.categories[0].items[0].name,`NoDot${i}`);\n}\n\nfor(let i=0;i<500;i++){\n  const state={categories:[{name:`${pick(i)}-${i}`,items:[{name:`${pick(i+1)}|${i}`,quantity:'1',remark:`${pick(i+2)}<&>${i}`}]}]};"""
if anchor not in text:
    raise SystemExit('hardpass insertion anchor not found')
text = text.replace(anchor, insert, 1)
fuzz.write_text(text)

for path in ['manifest.json','package.json']:
    p = Path(path)
    data = json.loads(p.read_text())
    data['version'] = '0.2.7'
    p.write_text(json.dumps(data, indent=2) + '\n')

p = Path('src/constants.js')
text = p.read_text().replace("export const VERSION = '0.2.6';", "export const VERSION = '0.2.7';", 1)
p.write_text(text)

p = Path('style.css')
text = p.read_text().replace('/* Inventory Block v0.2.6 */', '/* Inventory Block v0.2.7 */', 1)
p.write_text(text)

p = Path('README.md')
text = p.read_text().replace('# Inventory Block v0.2.6', '# Inventory Block v0.2.7', 1)
p.write_text(text)

p = Path('TEST-REPORT.md')
text = p.read_text().replace('# Inventory Block v0.2.6 Hotfix Report', '# Inventory Block v0.2.7 Hotfix Report', 1)
insert = '''\n## v0.2.7 optional terminal sentinel\n\nThe HTML-comment control remains the canonical machine envelope and the prompt still prefers a trailing period for SillyTavern sentence-trimming compatibility. A complete comment with valid JSON is now accepted even if the model omits that extra period; truly truncated or malformed controls remain atomic rejections.\n'''
if '## v0.2.7 optional terminal sentinel' not in text:
    text = text.replace('\n## Scope\n', insert + '\n## Scope\n', 1)
p.write_text(text)

p = Path('CHANGELOG.md')
text = p.read_text()
entry = '''## 0.2.7\n\nTerminal-sentinel resilience hotfix.\n\n- Accepts a complete valid `<!-- INVENTORY_BLOCK_UPDATE ... -->` control even when the model omits the trailing period.\n- Keeps the trailing period in the prompt as the preferred form for SillyTavern sentence-trimming compatibility.\n- Truncated comments, malformed JSON, and multiple controls remain rejected atomically.\n- Adds deterministic and fuzz regression coverage for periodless controls, including Megumin blocks after the control.\n\n'''
if '## 0.2.7' not in text:
    text = text.replace('# Changelog\n\n', '# Changelog\n\n' + entry, 1)
p.write_text(text)

p = Path('tests/release.test.js')
text = p.read_text()
text = text.replace('0.2.6', '0.2.7')
text = text.replace('0\\.2\\.6', '0\\.2\\.7')
text = text.replace('documents 0.2.6 aliases', 'documents 0.2.7 sentinel resilience')
text = text.replace('0.2.6 protocol keeps Megumin-safe placement and explicit canonical op grammar', '0.2.7 protocol accepts optional sentinel and keeps explicit canonical op grammar')
if "preferred for SillyTavern sentence-trimming compatibility" not in text:
    text = text.replace("assert.match(protocol,/normalizePatchOperation/);", "assert.match(protocol,/normalizePatchOperation/);\n    assert.match(protocol,/preferred for SillyTavern sentence-trimming compatibility/);\n    assert.doesNotMatch(protocol,/missing its required terminal period/);")
p.write_text(text)

p = Path('tests/integration-static.test.js')
text = p.read_text().replace('0.2.6', '0.2.7')
p.write_text(text)
