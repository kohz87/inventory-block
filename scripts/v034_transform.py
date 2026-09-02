from pathlib import Path

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text()

def write(path, text):
    (ROOT / path).write_text(text)

def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 occurrence, found {count}: {old[:100]!r}')
    write(path, text.replace(old, new, 1))

# Runtime: raw generation instead of a second full quiet/chat generation.
replace_once('index.js', 'let quietReconciliationActive = 0;', 'let rawReconciliationActive = 0;')
replace_once('index.js', 'if (quietReconciliationActive > 0) return;', 'if (rawReconciliationActive > 0) return;')
old_runtime = '''        const generateQuietPrompt = ctx.generateQuietPrompt;\n        if (typeof generateQuietPrompt !== 'function') {\n            reportWarnings(['SillyTavern generateQuietPrompt is unavailable; post-response inventory reconciliation was skipped.']);\n            attachReconciledRevision(ctx, session, message, id, baseRevision, baseRevision);\n            rememberBranchHead(ctx, baseRevision);\n            persistChatSoon(ctx, session.chatId);\n            refreshAll();\n            return;\n        }\n\n        const quietPrompt = buildReconciliationPrompt(baseState, {\n            userText: session.userInstruction,\n            assistantText: event.text,\n            type: session.type,\n            replaceCapability: session.replaceCapability,\n        });\n        let reply;\n        quietReconciliationActive += 1;\n        try {\n            reply = await generateQuietPrompt({ quietPrompt, skipWIAN: true, trimToSentence: false });\n        } finally {\n            quietReconciliationActive = Math.max(0, quietReconciliationActive - 1);\n        }\n'''
new_runtime = '''        const generateRaw = ctx.generateRaw;\n        if (typeof generateRaw !== 'function') {\n            reportWarnings(['SillyTavern generateRaw is unavailable; post-response inventory reconciliation was skipped.']);\n            attachReconciledRevision(ctx, session, message, id, baseRevision, baseRevision);\n            rememberBranchHead(ctx, baseRevision);\n            persistChatSoon(ctx, session.chatId);\n            refreshAll();\n            return;\n        }\n\n        const reconciliationPrompt = buildReconciliationPrompt(baseState, {\n            userText: session.userInstruction,\n            assistantText: event.text,\n            type: session.type,\n            replaceCapability: session.replaceCapability,\n        });\n        let reply;\n        rawReconciliationActive += 1;\n        try {\n            reply = await generateRaw({ prompt: reconciliationPrompt });\n        } finally {\n            rawReconciliationActive = Math.max(0, rawReconciliationActive - 1);\n        }\n'''
replace_once('index.js', old_runtime, new_runtime)

# Version stamps.
replace_once('src/constants.js', "export const VERSION = '0.3.3';", "export const VERSION = '0.3.4';")
replace_once('package.json', '"version": "0.3.3"', '"version": "0.3.4"')
replace_once('manifest.json', '"version": "0.3.3"', '"version": "0.3.4"')
replace_once('style.css', '/* Inventory Block v0.3.3 */', '/* Inventory Block v0.3.4 */')
replace_once('README.md', '# Inventory Block v0.3.3', '# Inventory Block v0.3.4')
replace_once('README.md', 'After the assistant message is complete, Inventory Block runs one hidden `generateQuietPrompt` reconciliation pass. That quiet scan receives the authoritative pre-response inventory plus the completed user/assistant event, returns either `NO_CHANGE` or one machine patch internally, and then the existing atomic backend validator commits the result.', 'After the assistant message is complete, Inventory Block runs one hidden `generateRaw` reconciliation pass. That minimal raw scan receives only the authoritative pre-response inventory plus the completed user/assistant event, returns either `NO_CHANGE` or one machine patch internally, and then the existing atomic backend validator commits the result. It does not rebuild a second full character/chat generation context.')

# Release notes.
changelog = read('CHANGELOG.md')
write('CHANGELOG.md', '''## 0.3.4\n\nGemini/API compatibility hotfix for post-response reconciliation.\n\n- Replaces the hidden `generateQuietPrompt` reconciliation call with SillyTavern `generateRaw({ prompt })`.\n- Sends the reconciler through the minimal raw generation path instead of rebuilding a second full character/chat generation.\n- Keeps the visible RP generation, read-only inventory reference, completion latch, Continue suffix accounting, Swipe/Regenerate base semantics, and atomic backend validation unchanged.\n- Fails closed when `generateRaw` is unavailable and preserves the message's inventory revision metadata.\n- Adds regression coverage that forbids `generateQuietPrompt` in the reconciliation runtime.\n\n''' + changelog)
report = read('TEST-REPORT.md')
report = report.replace('# Inventory Block v0.3.3 Post-Response Reconciliation Report', '# Inventory Block v0.3.4 Raw Reconciliation Compatibility Report', 1)
report = report.replace('## v0.3.3 post-response reconciliation', '## v0.3.4 raw reconciliation compatibility\n\nv0.3.4 keeps the post-response architecture but routes its hidden scanner through SillyTavern `generateRaw({ prompt })` instead of `generateQuietPrompt`. This avoids rebuilding a second full chat-generation context for bookkeeping and improves compatibility with strict providers such as Gemini while preserving the same validated patch protocol.\n\n## v0.3.3 post-response reconciliation', 1)
write('TEST-REPORT.md', report)

# Release metadata tests.
release = read('tests/release.test.js')
release = release.replace('all release metadata and runtime VERSION say 0.3.3', 'all release metadata and runtime VERSION say 0.3.4')
release = release.replace("'0.3.3'", "'0.3.4'", 2)
release = release.replace("/VERSION = '0\\.3\\.3'/", "/VERSION = '0\\.3\\.4'/", 1)
release = release.replace('/^\\/\\* Inventory Block v0\\.3\\.3 \\*\\//', '/^\\/\\* Inventory Block v0\\.3\\.4 \\*\\//', 1)
release = release.replace('/Inventory Block v0\\.3\\.3/', '/Inventory Block v0\\.3\\.4/', 1)
release = release.replace("test('changelog documents v0.3.3 post-response reconciliation and retains prior hardening'", "test('changelog documents v0.3.4 raw reconciliation compatibility and retains prior hardening'")
release = release.replace("  assert.match(changelog,/## 0\\.3\\.3/);\n  assert.match(changelog,/generateQuietPrompt/);", "  assert.match(changelog,/## 0\\.3\\.4/);\n  assert.match(changelog,/generateRaw/);\n  assert.match(changelog,/minimal raw generation path/i);\n  assert.match(changelog,/## 0\\.3\\.3/);\n  assert.match(changelog,/generateQuietPrompt/);")
release = release.replace("test('v0.3.3 keeps resource/history hardening behind post-response reconciliation'", "test('v0.3.4 keeps resource/history hardening behind raw post-response reconciliation'")
write('tests/release.test.js', release)

static = read('tests/integration-static.test.js')
static = static.replace('release metadata, runtime version, and interceptor are v0.3.3', 'release metadata, runtime version, and interceptor are v0.3.4')
static = static.replace("'0.3.3'", "'0.3.4'", 2)
static = static.replace("/VERSION = '0\\.3\\.3'/", "/VERSION = '0\\.3\\.4'/", 1)
static = static.replace("test('v0.3.3 has no fake prompt slot or global live extension prompt'", "test('v0.3.4 has no fake prompt slot or global live extension prompt'")
static = static.replace('  assert.match(index,/generateQuietPrompt/);', '  assert.match(index,/generateRaw/);\n  assert.doesNotMatch(index,/generateQuietPrompt/);')
write('tests/integration-static.test.js', static)

v033 = read('tests/v033-reconcile.test.js')
v033 = v033.replace('  assert.match(block, /generateQuietPrompt/);', '  assert.match(block, /generateRaw/);\n  assert.match(block, /generateRaw\\(\\{ prompt: reconciliationPrompt \\}\\)/);\n  assert.doesNotMatch(block, /generateQuietPrompt/);')
v033 = v033.replace('  assert.match(index, /quietReconciliationActive/);\n  assert.match(index, /if \\(quietReconciliationActive > 0\\) return/);', '  assert.match(index, /rawReconciliationActive/);\n  assert.match(index, /if \\(rawReconciliationActive > 0\\) return/);')
write('tests/v033-reconcile.test.js', v033)

# Dedicated compatibility regression.
write('tests/v034-raw-compat.test.js', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('post-response reconciler uses the minimal generateRaw API', () => {
  const start = index.indexOf('async function reconcileCompletedSession');
  const end = index.indexOf('function maybeStartReconciliation', start);
  assert.ok(start >= 0 && end > start);
  const block = index.slice(start, end);
  assert.match(block, /const generateRaw = ctx\.generateRaw/);
  assert.match(block, /await generateRaw\(\{ prompt: reconciliationPrompt \}\)/);
  assert.doesNotMatch(block, /generateQuietPrompt/);
  assert.doesNotMatch(block, /skipWIAN|trimToSentence|quietPrompt/);
});

test('raw reconciliation remains isolated from foreground prompt-ready injection', () => {
  assert.match(index, /let rawReconciliationActive = 0/);
  assert.match(index, /rawReconciliationActive \+= 1/);
  assert.match(index, /rawReconciliationActive = Math\.max\(0, rawReconciliationActive - 1\)/);
  assert.match(index, /if \(rawReconciliationActive > 0\) return/);
});
''')

# Final sanity: no current runtime use of the old quiet call.
index = read('index.js')
if 'generateQuietPrompt' in index:
    raise SystemExit('index.js still contains generateQuietPrompt after v0.3.4 transform')
print('v0.3.4 transform applied')
