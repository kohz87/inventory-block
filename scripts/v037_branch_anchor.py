from pathlib import Path
import re

ROOT = Path('.')
def read(path): return (ROOT / path).read_text()
def write(path, text): (ROOT / path).write_text(text)
def once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

def sub_once(text, pattern, repl, label, flags=0):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected one regex match, found {count}')
    return out

# ---------------- state.js ----------------
path = 'src/state.js'
text = read(path)
text = once(text,
"const ROOT_ALIASES = new Set(['general', 'uncategorized']);\n",
"const ROOT_ALIASES = new Set(['general', 'uncategorized']);\nconst DURABLE_SOURCES = new Set([SOURCE.SEED, SOURCE.MANUAL, SOURCE.RESTORE, SOURCE.IMPORT, SOURCE.RESET]);\n\nfunction isDurableSource(source) {\n    return DURABLE_SOURCES.has(source);\n}\n",
'durable source set')

text = once(text,
"""        activeRevision: 0,\n        nextRevision: 1,\n        mutationSerial: 0,\n""",
"""        activeRevision: 0,\n        durableRevision: 0,\n        nextRevision: 1,\n        mutationSerial: 0,\n""",
'durable root field')

text = once(text,
"""    tryKeep(0, true);\n    tryKeep(root.activeRevision, true);\n    const heads = Object.values(root.branchHeads ?? {})\n""",
"""    tryKeep(0, true);\n    tryKeep(root.activeRevision, true);\n    tryKeep(root.durableRevision, true);\n    const heads = Object.values(root.branchHeads ?? {})\n""",
'keep durable revision')

text = once(text,
"""    root.activeRevision = id;\n    if (countMutation) root.mutationSerial += 1;\n    compactRevisions(root);\n""",
"""    root.activeRevision = id;\n    if (isDurableSource(source)) root.durableRevision = id;\n    if (countMutation) root.mutationSerial += 1;\n    compactRevisions(root);\n""",
'promote durable source')

text = once(text,
"""    protectLatestRevision(root.activeRevision, null, true);\n    const heads = Object.values(root.branchHeads ?? {})\n""",
"""    protectLatestRevision(root.activeRevision, null, true);\n    protectLatestRevision(root.durableRevision, null, true);\n    const heads = Object.values(root.branchHeads ?? {})\n""",
'protect durable checkpoint')

text = once(text,
"""    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) root.activeRevision = 0;\n    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));\n""",
"""    if (!Number.isInteger(root.activeRevision) || !root.revisions[String(root.activeRevision)]) root.activeRevision = 0;\n    if (!Number.isInteger(root.durableRevision) || !root.revisions[String(root.durableRevision)]) {\n        const durableIds = Object.values(root.revisions)\n            .filter(revision => revision && Number.isInteger(revision.id) && isDurableSource(revision.source))\n            .map(revision => revision.id)\n            .sort((a, b) => a - b);\n        root.durableRevision = durableIds.at(-1) ?? 0;\n    }\n    const maxRevisionId = Math.max(0, ...Object.keys(root.revisions).map(Number).filter(Number.isInteger));\n""",
'migrate durable revision')

text = once(text,
"""export function getCurrentInventory(context) {\n    const root = ensureRoot(context);\n    return getInventoryAt(root, root.activeRevision);\n}\n\nexport function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {\n""",
"""export function getCurrentInventory(context) {\n    const root = ensureRoot(context);\n    return getInventoryAt(root, root.activeRevision);\n}\n\nexport function markDurableRevision(context, revisionId = null) {\n    const root = ensureRoot(context);\n    const id = revisionId === null ? root.activeRevision : Number(revisionId);\n    if (!Number.isInteger(id) || !getRevision(root, id)) throw new Error(`Cannot mark missing inventory revision ${revisionId} as durable.`);\n    root.durableRevision = id;\n    compactRevisions(root);\n    return id;\n}\n\nexport function createRevision(context, state, { parent = null, source = SOURCE.MANUAL, note = '' } = {}) {\n""",
'mark durable API')

text = once(text,
"""function revisionDescendsFrom(root, revisionId, baseRevision) {\n    if (revisionId === baseRevision) return true;\n    const seen = new Set();\n    let cursor = revisionId;\n    while (Number.isInteger(cursor) && !seen.has(cursor)) {\n        seen.add(cursor);\n        const revision = getRevision(root, cursor);\n        if (!revision) return false;\n        if (revision.parent === baseRevision) return true;\n        cursor = revision.parent;\n    }\n    return false;\n}\n\nfunction expectedMetaHash(context, index, meta, data, legacyFingerprints) {\n""",
"""function revisionDescendsFrom(root, revisionId, baseRevision) {\n    if (revisionId === baseRevision) return true;\n    const seen = new Set();\n    let cursor = revisionId;\n    while (Number.isInteger(cursor) && !seen.has(cursor)) {\n        seen.add(cursor);\n        const revision = getRevision(root, cursor);\n        if (!revision) return false;\n        if (revision.parent === baseRevision) return true;\n        cursor = revision.parent;\n    }\n    return false;\n}\n\nfunction revisionAtOrAfter(root, revisionId, floorRevision) {\n    if (!Number.isInteger(revisionId) || !getRevision(root, revisionId)) return false;\n    if (!Number.isInteger(floorRevision) || floorRevision === 0) return true;\n    return revisionId === floorRevision || revisionDescendsFrom(root, revisionId, floorRevision);\n}\n\nfunction checkpointAtOrAfterFloor(root, checkpoint, floorRevision) {\n    if (!Number.isInteger(floorRevision) || floorRevision === 0) return true;\n    return revisionAtOrAfter(root, checkpoint?.revision, floorRevision);\n}\n\nfunction metadataAtOrAfterFloor(root, meta, floorRevision) {\n    if (!Number.isInteger(floorRevision) || floorRevision === 0) return true;\n    return revisionAtOrAfter(root, meta?.baseRevision, floorRevision)\n        || revisionAtOrAfter(root, meta?.revision, floorRevision)\n        || checkpointAtOrAfterFloor(root, meta?.checkpoint, floorRevision);\n}\n\nfunction expectedMetaHash(context, index, meta, data, legacyFingerprints) {\n""",
'durable floor helpers')

# Replace portable assistant materialization with floor-aware form.
pattern = r"function materializePortableAssistant\(context, root, index, currentRevision, meta, data, legacyFingerprints\) \{.*?\n\}\n\nfunction checkpointRevisionIfValid"
replacement = """function materializePortableAssistant(context, root, index, currentRevision, meta, data, legacyFingerprints, floorRevision = 0) {\n    const message = context?.chat?.[index];\n    if (!message || message.is_user || message.is_system || !meta) return null;\n    const checkpoint = meta.checkpoint;\n    if (checkpoint && checkpointAtOrAfterFloor(root, checkpoint, floorRevision)) {\n        const revision = materializeCheckpoint(context, root, index, currentRevision, checkpoint, data, legacyFingerprints);\n        if (revision !== null) {\n            message.extra ??= {};\n            message.extra[EXTRA_KEY] = {\n                ...meta, uid: meta.uid || randomUid(), baseRevision: currentRevision, revision,\n                lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION, checkpoint,\n            };\n            ensureSwipeInfo(message);\n            return revision;\n        }\n    }\n    if ((meta.lineageVersion ?? 1) === LINEAGE_VERSION\n        && meta.revision === meta.baseRevision\n        && revisionAtOrAfter(root, meta.revision, floorRevision)) {\n        message.extra ??= {};\n        message.extra[EXTRA_KEY] = {\n            ...meta, uid: meta.uid || randomUid(), baseRevision: currentRevision, revision: currentRevision,\n            lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION,\n        };\n        ensureSwipeInfo(message);\n        return currentRevision;\n    }\n    return null;\n}\n\nfunction checkpointRevisionIfValid"""
text = sub_once(text, pattern, replacement, 'floor-aware portable assistant', re.S)

# Add floor argument/guard to checkpoint resolver.
text = once(text,
"""function checkpointRevisionIfValid(context, root, index, currentRevision, afterAssistant, data, legacyFingerprints) {\n    const message = context?.chat?.[index];\n    const checkpoint = activeMessageMeta(message)?.checkpoint;\n    if (!checkpoint || !checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) return currentRevision;\n""",
"""function checkpointRevisionIfValid(context, root, index, currentRevision, afterAssistant, data, legacyFingerprints, floorRevision = 0) {\n    const message = context?.chat?.[index];\n    const checkpoint = activeMessageMeta(message)?.checkpoint;\n    if (!checkpoint || !checkpointAtOrAfterFloor(root, checkpoint, floorRevision) || !checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) return currentRevision;\n""",
'floor-aware checkpoint resolver')

# Replace active resolver with durable-floor resolver and prefix helper.
pattern = r"export function resolveActiveRevision\(context\) \{.*?\n\}\n\nexport function attachPortableCheckpoint"
replacement = """function resolveRevisionThrough(context, maxLength, { commitActive = false } = {}) {\n    const root = ensureRoot(context);\n    stabilizeAssistantUids(context);\n    const data = lineageData(context);\n    const chat = Array.isArray(context?.chat) ? context.chat : [];\n    const end = Math.max(0, Math.min(chat.length, Number.isInteger(Number(maxLength)) ? Number(maxLength) : chat.length));\n    const legacyFingerprints = chat.map(messageFingerprintLegacy);\n    const legacyPrefix = length => legacyHashLineage(legacyFingerprints.slice(0, length));\n    const floorRevision = Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision) ? root.durableRevision : 0;\n    const previousActive = root.activeRevision;\n\n    let bestHead = null;\n    let bestLength = -1;\n    for (const [branchKey, head] of Object.entries(root.branchHeads)) {\n        if (!Number.isInteger(head?.revision) || !getRevision(root, head.revision)) continue;\n        if (!revisionAtOrAfter(root, head.revision, floorRevision)) continue;\n        const length = Number.isInteger(head.length) ? head.length : Number.parseInt(String(branchKey).split(':', 1)[0], 10);\n        if (!Number.isInteger(length) || length < 0 || length > end || length <= bestLength) continue;\n        const expectedKey = (head.lineageVersion ?? 1) === LINEAGE_VERSION ? data.prefixKeys[length] : legacyPrefix(length);\n        if (expectedKey !== branchKey) continue;\n        bestHead = head;\n        bestLength = length;\n    }\n\n    let revision = bestHead?.revision ?? floorRevision;\n    const startIndex = bestLength >= 0 ? bestLength : 0;\n    if (bestHead && commitActive) bestHead.touchedAt = Date.now();\n    for (let index = startIndex; index < end; index++) {\n        const message = chat[index];\n        if (!message) continue;\n        if (message.is_user || message.is_system) {\n            revision = checkpointRevisionIfValid(context, root, index, revision, true, data, legacyFingerprints, floorRevision);\n            continue;\n        }\n        const meta = activeMessageMeta(message);\n        if (!meta || !metadataAtOrAfterFloor(root, meta, floorRevision)) continue;\n        const expectedLineageHash = expectedMetaHash(context, index, meta, data, legacyFingerprints);\n        if (!validMessageRevision(root, meta, revision, expectedLineageHash)) {\n            const recovered = materializePortableAssistant(context, root, index, revision, meta, data, legacyFingerprints, floorRevision);\n            if (recovered === null) break;\n            revision = recovered;\n            continue;\n        }\n        revision = meta.revision;\n        revision = checkpointRevisionIfValid(context, root, index, revision, true, data, legacyFingerprints, floorRevision);\n    }\n\n    if (commitActive) {\n        root.activeRevision = revision;\n        compactRevisions(root);\n        compactPortableCheckpointsWithRoot(context, root);\n    } else {\n        root.activeRevision = previousActive;\n    }\n    return revision;\n}\n\nexport function resolveRevisionBeforeMessage(context, messageId) {\n    const id = Number(messageId);\n    const length = Number.isInteger(id) ? Math.max(0, id) : 0;\n    return resolveRevisionThrough(context, length, { commitActive: false });\n}\n\nexport function resolveActiveRevision(context) {\n    const chat = Array.isArray(context?.chat) ? context.chat : [];\n    return resolveRevisionThrough(context, chat.length, { commitActive: true });\n}\n\nexport function attachPortableCheckpoint"""
text = sub_once(text, pattern, replacement, 'durable active resolver', re.S)

text = once(text,
"""    const previous = getInventoryAt(root, root.activeRevision);\n    if (inventoryEquals(previous, normalized)) return root.activeRevision;\n    const revision = createRevision(context, normalized, { parent: root.activeRevision, source, note });\n""",
"""    const previous = getInventoryAt(root, root.activeRevision);\n    if (inventoryEquals(previous, normalized)) {\n        root.durableRevision = root.activeRevision;\n        compactRevisions(root);\n        return root.activeRevision;\n    }\n    const revision = createRevision(context, normalized, { parent: root.activeRevision, source, note });\n""",
'promote no-op manual save')
write(path, text)

# ---------------- index.js ----------------
path = 'index.js'
text = read(path)
text = once(text,
"""    lineageHashThrough,\n    listRevisions,\n    rememberBranchHead,\n    resolveActiveRevision,\n""",
"""    lineageHashThrough,\n    listRevisions,\n    markDurableRevision,\n    rememberBranchHead,\n    resolveActiveRevision,\n    resolveRevisionBeforeMessage,\n""",
'import durable helpers')

text = once(text,
"""        attachReconciledRevision(live, session, message, id, acceptedRevision, baseRevision);\n        if (!warnings.length) stampReconciliation(live, id, acceptedRevision);\n""",
"""        if (!warnings.length && session.replaceCapability) markDurableRevision(live, acceptedRevision);\n        attachReconciledRevision(live, session, message, id, acceptedRevision, baseRevision);\n        if (!warnings.length) stampReconciliation(live, id, acceptedRevision);\n""",
'automatic admin durable')

text = once(text,
"""    const pseudoSession = { chatId: expectedChatId, type: stamp ? 'continue' : 'manual_reconcile' };\n    attachReconciledRevision(live, pseudoSession, message, id, acceptedRevision, baseRevision);\n""",
"""    if (replaceCapability) markDurableRevision(live, acceptedRevision);\n    const pseudoSession = { chatId: expectedChatId, type: stamp ? 'continue' : 'manual_reconcile' };\n    attachReconciledRevision(live, pseudoSession, message, id, acceptedRevision, baseRevision);\n""",
'manual admin durable')

text = once(text,
"""        message.mes = result.cleanedText;\n        const effectiveBase = concurrentConflict ? acceptedRevision : baseRevision;\n""",
"""        if (!concurrentConflict && warnings.length === 0 && pendingApplies && session?.replaceCapability) markDurableRevision(ctx, acceptedRevision);\n        message.mes = result.cleanedText;\n        const effectiveBase = concurrentConflict ? acceptedRevision : baseRevision;\n""",
'legacy admin durable')

old = """function onMessageSwiped(messageId) {\n    setTimeout(async () => {\n        const ctx = context();\n        const id = Number(messageId);\n        if (!ctx || !hasActiveChat(ctx) || !Number.isInteger(id)) return;\n        try {\n            invalidateLineageCache(ctx);\n            const revision = resolveActiveRevision(ctx);\n            const message = ctx.chat?.[id];\n            if (message && !message.is_user && !message.is_system && hasInventoryControl(message.mes)) {\n                await processAssistantMessage(id, 'existing_swipe');\n                return;\n            }\n            if (message && !message.is_user && !message.is_system) {\n                const meta = activeMessageMeta(message);\n                if (!meta || meta.lineageHash !== lineageHashThrough(ctx, id)) attachMessageRevision(ctx, id, { baseRevision: revision, revision, newUid: true, portable: false });\n            }\n            rememberBranchHead(ctx);\n            ctx.saveMetadataDebounced?.();\n            refreshAll();\n        } catch (error) {\n            console.warn('[Inventory Block] Could not restore swiped inventory branch.', error);\n        }\n    }, 20);\n}\n"""
new = """function onMessageSwiped(messageId) {\n    setTimeout(async () => {\n        const ctx = context();\n        const id = Number(messageId);\n        if (!ctx || !hasActiveChat(ctx) || !Number.isInteger(id)) return;\n        try {\n            invalidateLineageCache(ctx);\n            const message = ctx.chat?.[id];\n            if (message && !message.is_user && !message.is_system && hasInventoryControl(message.mes)) {\n                await processAssistantMessage(id, 'existing_swipe');\n                return;\n            }\n            if (message && !message.is_user && !message.is_system) {\n                const meta = activeMessageMeta(message);\n                const expectedHash = lineageHashThrough(ctx, id);\n                if (!meta || meta.lineageHash !== expectedHash) {\n                    // A new/untracked swipe inherits the inventory immediately before this\n                    // assistant response. Never resolve the changed branch first, because\n                    // missing swipe metadata must not turn into revision 0/empty inventory.\n                    const baseRevision = resolveRevisionBeforeMessage(ctx, id);\n                    attachMessageRevision(ctx, id, { baseRevision, revision: baseRevision, newUid: true, portable: false });\n                }\n            }\n            const revision = resolveActiveRevision(ctx);\n            rememberBranchHead(ctx, revision);\n            ctx.saveMetadataDebounced?.();\n            refreshAll();\n        } catch (error) {\n            console.warn('[Inventory Block] Could not restore swiped inventory branch.', error);\n        }\n    }, 20);\n}\n"""
text = once(text, old, new, 'safe swipe inheritance')
write(path, text)

# ---------------- release metadata ----------------
for path in ['manifest.json', 'package.json', 'src/constants.js', 'style.css', 'README.md', 'TEST-REPORT.md']:
    text = read(path)
    if '0.3.6' not in text:
        raise SystemExit(f'{path}: missing 0.3.6 release marker')
    write(path, text.replace('0.3.6', '0.3.7', 1))

path = 'CHANGELOG.md'
text = read(path)
entry = """## 0.3.7\n\nBranch-anchor hardening for swipe and message deletion.\n\n- Adds a chat-level durable inventory revision for starting seeds and explicit administrative state (manual edits, imports, restores, resets, and broad OOC inventory administration).\n- Uses the durable revision as the resolver floor, so losing a tail-message checkpoint can no longer collapse an established inventory to revision 0.\n- Keeps ordinary LLM inventory changes above that floor branch-sensitive, so deleting a purchase/loot response still rolls that narrative change back.\n- Migrates existing v0.3.6 metadata by recovering the newest durable-source revision already present in history.\n- Forces history compaction to retain the durable revision and its portable checkpoint when available.\n- Adds prefix resolution for swipes: an untracked/new swipe inherits inventory from immediately before that assistant response instead of first resolving an incomplete branch.\n- Keeps processed swipes independent while preventing missing swipe metadata from being stamped with an accidental empty fallback.\n\n"""
write(path, entry + text)

# Static release tests that pin the current version.
for path in ['tests/release.test.js', 'tests/integration-static.test.js']:
    text = read(path)
    text = text.replace('0.3.6', '0.3.7')
    text = text.replace('0\\.3\\.6', '0\\.3\\.7')
    write(path, text)

# New branch/deletion regression suite.
path = 'tests/v037-branch-anchor.test.js'
write(path, """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {\n  attachMessageRevision, commitManualState, createRevision, ensureRoot, getCurrentInventory,\n  getRevision, invalidateLineageCache, markDurableRevision, rememberBranchHead,\n  resolveActiveRevision, resolveRevisionBeforeMessage,\n} from '../src/state.js';\nimport { EXTRA_KEY, SOURCE } from '../src/constants.js';\n\nconst inv = items => ({ categories: [{ name: 'General', items }] });\nconst item = (name, quantity = '1', remark = '') => ({ name, quantity, remark });\nconst assistant = (mes, extra = {}) => ({ is_user: false, is_system: false, mes, extra });\nconst user = mes => ({ is_user: true, is_system: false, mes, extra: {} });\nconst ctx = chat => ({ chat, chatMetadata: {} });\n\ntest('manual inventory survives deletion of the tail message that carried its checkpoint', () => {\n  const c = ctx([user('setup'), assistant('done')]);\n  ensureRoot(c);\n  const manual = commitManualState(c, inv([item('Coin Pouch', '1', '100 Gold'), item('Sword')]), { source: SOURCE.MANUAL });\n  assert.equal(ensureRoot(c).durableRevision, manual);\n  assert.ok(c.chat[1].extra[EXTRA_KEY].checkpoint);\n  c.chat.pop();\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), manual);\n  assert.equal(getCurrentInventory(c).categories[0].items.length, 2);\n});\n\ntest('deleting an LLM purchase response rolls back to the durable pre-purchase state', () => {\n  const c = ctx([assistant('start'), user('buy sword'), assistant('purchase complete')]);\n  const root = ensureRoot(c);\n  const baseline = createRevision(c, inv([item('Coin Pouch', '1', '100 Gold')]), { parent: 0, source: SOURCE.SEED });\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: baseline, newUid: true, portable: true });\n  rememberBranchHead(c, baseline);\n  const purchase = createRevision(c, inv([item('Coin Pouch', '1', '80 Gold'), item('Sword')]), { parent: baseline, source: SOURCE.LLM });\n  attachMessageRevision(c, 2, { baseRevision: baseline, revision: purchase, newUid: true, portable: true });\n  rememberBranchHead(c, purchase);\n  assert.equal(resolveActiveRevision(c), purchase);\n  c.chat.pop();\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), baseline);\n  assert.deepEqual(getCurrentInventory(c).categories[0].items.map(x => x.name), ['Coin Pouch']);\n  assert.equal(root.durableRevision, baseline);\n});\n\ntest('a new untracked swipe inherits inventory immediately before the assistant response', () => {\n  const target = assistant('first answer');\n  target.swipes = ['first answer', 'alternate'];\n  target.swipe_info = [{}, {}];\n  target.swipe_id = 0;\n  const c = ctx([assistant('start'), user('question'), target]);\n  ensureRoot(c);\n  const baseline = createRevision(c, inv([item('Torch', '3')]), { parent: 0, source: SOURCE.SEED });\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: baseline, newUid: true, portable: true });\n  attachMessageRevision(c, 2, { baseRevision: baseline, revision: baseline, newUid: true, portable: false });\n  target.swipe_id = 1;\n  target.mes = 'alternate';\n  target.extra = {};\n  target.swipe_info[1] = {};\n  invalidateLineageCache(c);\n  const inherited = resolveRevisionBeforeMessage(c, 2);\n  assert.equal(inherited, baseline);\n  attachMessageRevision(c, 2, { baseRevision: inherited, revision: inherited, newUid: true, portable: false });\n  assert.equal(resolveActiveRevision(c), baseline);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name, 'Torch');\n});\n\ntest('starting seed remains durable even when its original message is removed', () => {\n  const c = ctx([assistant('seed message')]);\n  ensureRoot(c);\n  const seed = createRevision(c, inv([item('Waterskin')]), { parent: 0, source: SOURCE.SEED });\n  attachMessageRevision(c, 0, { baseRevision: 0, revision: seed, newUid: true, portable: true });\n  c.chat.splice(0, 1);\n  invalidateLineageCache(c);\n  assert.equal(resolveActiveRevision(c), seed);\n  assert.equal(getCurrentInventory(c).categories[0].items[0].name, 'Waterskin');\n});\n\ntest('v0.3.6 metadata without durableRevision migrates to newest durable-source revision', () => {\n  const c = ctx([assistant('tail')]);\n  const root = ensureRoot(c);\n  const manual = commitManualState(c, inv([item('Knife')]), { source: SOURCE.MANUAL });\n  createRevision(c, inv([item('Knife'), item('Coin')]), { parent: manual, source: SOURCE.LLM });\n  delete root.durableRevision;\n  ensureRoot(c);\n  assert.equal(root.durableRevision, manual);\n});\n\ntest('history compaction never prunes the durable revision', () => {\n  const c = ctx([assistant('tail')]);\n  const root = ensureRoot(c);\n  const durable = commitManualState(c, inv([item('Anchor')]), { source: SOURCE.MANUAL });\n  let parent = durable;\n  for (let i = 0; i < 230; i++) {\n    parent = createRevision(c, inv([item('Anchor'), item(`Loot ${i}`)]), { parent, source: SOURCE.LLM });\n  }\n  assert.equal(root.durableRevision, durable);\n  assert.ok(getRevision(root, durable));\n});\n\ntest('explicit administrative reconciliation can promote an LLM revision to durable', () => {\n  const c = ctx([assistant('tail')]);\n  const root = ensureRoot(c);\n  const revision = createRevision(c, inv([item('Admin Set')]), { parent: 0, source: SOURCE.LLM });\n  assert.equal(root.durableRevision, 0);\n  markDurableRevision(c, revision);\n  assert.equal(root.durableRevision, revision);\n  c.chat.length = 0;\n  assert.equal(resolveActiveRevision(c), revision);\n});\n""")

# Static assertions for the runtime swipe/admin wiring.
path = 'tests/v037-runtime-static.test.js'
write(path, """import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');\nconst state = fs.readFileSync(new URL('../src/state.js', import.meta.url), 'utf8');\n\ntest('swipe handler resolves the prefix before resolving the changed branch', () => {\n  const fn = index.slice(index.indexOf('function onMessageSwiped'), index.indexOf('function onChatChanged'));\n  assert.match(fn, /resolveRevisionBeforeMessage\\(ctx, id\\)/);\n  assert.ok(fn.indexOf('resolveRevisionBeforeMessage(ctx, id)') < fn.indexOf('resolveActiveRevision(ctx)'));\n  assert.match(fn, /baseRevision, revision: baseRevision/);\n});\n\ntest('durable floor is wired into branch resolution and administrative reconciliation', () => {\n  assert.match(state, /durableRevision/);\n  assert.match(state, /bestHead\\?\\.revision \\?\\? floorRevision/);\n  assert.match(index, /session\\.replaceCapability\\) markDurableRevision/);\n  assert.match(index, /if \\(replaceCapability\\) markDurableRevision/);\n});\n""")

print('v0.3.7 branch-anchor transform complete')
