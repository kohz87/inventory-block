from pathlib import Path
p=Path('tests/integration-static.test.js')
text=p.read_text()
text=text.replace("test('release metadata, runtime version, and interceptor are v0.3.5',()=>{", "test('release metadata, runtime version, and interceptor are v0.3.6',()=>{", 1)
text=text.replace("assert.equal(manifest.version,'0.3.5');", "assert.equal(manifest.version,'0.3.6');", 1)
text=text.replace("assert.equal(pkg.version,'0.3.5');", "assert.equal(pkg.version,'0.3.6');", 1)
text=text.replace("assert.match(constants,/VERSION = '0\\.3\\.5'/);", "assert.match(constants,/VERSION = '0\\.3\\.6'/);", 1)
p.write_text(text)
print('v0.3.6 static release expectation updated')
