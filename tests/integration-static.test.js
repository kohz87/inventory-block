import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexSource = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const styleSource = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');

test('manifest registers the generation-local inventory interceptor for v0.2.3', () => {
    assert.equal(manifest.version, '0.2.3');
    assert.equal(manifest.generate_interceptor, 'inventoryBlockGenerationInterceptor');
    assert.match(indexSource, /globalThis\.inventoryBlockGenerationInterceptor\s*=\s*onGenerationInterceptor/);
});

test('legacy terminal-event bridge bookkeeping is absent', () => {
    assert.doesNotMatch(indexSource, /backgroundGenerationDepth/);
    assert.doesNotMatch(indexSource, /recentGeneration/);
    assert.doesNotMatch(indexSource, /events\.GENERATION_ENDED/);
});

test('release CSS banner matches v0.2.3', () => {
    assert.match(styleSource, /^\/\* Inventory Block v0\.2\.3 \*\//);
});
