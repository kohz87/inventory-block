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

path='src/state.js'
text=read(path)

# Keep durableRevision as a loss-prevention fallback, not a hard branch floor.
helpers="""function revisionAtOrAfter(root, revisionId, floorRevision) {\n    if (!Number.isInteger(revisionId) || !getRevision(root, revisionId)) return false;\n    if (!Number.isInteger(floorRevision) || floorRevision === 0) return true;\n    return revisionId === floorRevision || revisionDescendsFrom(root, revisionId, floorRevision);\n}\n\nfunction checkpointAtOrAfterFloor(root, checkpoint, floorRevision) {\n    if (!Number.isInteger(floorRevision) || floorRevision === 0) return true;\n    return revisionAtOrAfter(root, checkpoint?.revision, floorRevision);\n}\n\nfunction metadataAtOrAfterFloor(root, meta, floorRevision) {\n    if (!Number.isInteger(floorRevision) || floorRevision === 0) return true;\n    return revisionAtOrAfter(root, meta?.baseRevision, floorRevision)\n        || revisionAtOrAfter(root, meta?.revision, floorRevision)\n        || checkpointAtOrAfterFloor(root, meta?.checkpoint, floorRevision);\n}\n\n"""
if text.count(helpers) != 1:
    raise SystemExit('remove hard-floor helpers: expected one block')
text=text.replace(helpers,'',1)

pattern=r"function materializePortableAssistant\(context, root, index, currentRevision, meta, data, legacyFingerprints, floorRevision = 0\) \{.*?\n\}\n\nfunction checkpointRevisionIfValid"
replacement="""function materializePortableAssistant(context, root, index, currentRevision, meta, data, legacyFingerprints) {\n    const message = context?.chat?.[index];\n    if (!message || message.is_user || message.is_system || !meta) return null;\n    const checkpoint = meta.checkpoint;\n    if (checkpoint) {\n        const revision = materializeCheckpoint(context, root, index, currentRevision, checkpoint, data, legacyFingerprints);\n        if (revision !== null) {\n            message.extra ??= {};\n            message.extra[EXTRA_KEY] = {\n                ...meta, uid: meta.uid || randomUid(), baseRevision: currentRevision, revision,\n                lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION, checkpoint,\n            };\n            ensureSwipeInfo(message);\n            return revision;\n        }\n    }\n    if ((meta.lineageVersion ?? 1) === LINEAGE_VERSION && meta.revision === meta.baseRevision) {\n        message.extra ??= {};\n        message.extra[EXTRA_KEY] = {\n            ...meta, uid: meta.uid || randomUid(), baseRevision: currentRevision, revision: currentRevision,\n            lineageHash: data.prefixKeys[index + 1] ?? 'root', lineageVersion: LINEAGE_VERSION,\n        };\n        ensureSwipeInfo(message);\n        return currentRevision;\n    }\n    return null;\n}\n\nfunction checkpointRevisionIfValid"""
text=sub_once(text,pattern,replacement,'restore branch-local portable materialization',re.S)

text=once(text,
"""function checkpointRevisionIfValid(context, root, index, currentRevision, afterAssistant, data, legacyFingerprints, floorRevision = 0) {\n    const message = context?.chat?.[index];\n    const checkpoint = activeMessageMeta(message)?.checkpoint;\n    if (!checkpoint || !checkpointAtOrAfterFloor(root, checkpoint, floorRevision) || !checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) return currentRevision;\n""",
"""function checkpointRevisionIfValid(context, root, index, currentRevision, afterAssistant, data, legacyFingerprints) {\n    const message = context?.chat?.[index];\n    const checkpoint = activeMessageMeta(message)?.checkpoint;\n    if (!checkpoint || !checkpointValidForMessage(context, index, checkpoint, data, legacyFingerprints)) return currentRevision;\n""",
'restore checkpoint semantics')

pattern=r"function resolveRevisionThrough\(context, maxLength, \{ commitActive = false \} = \{\}\) \{.*?\n\}\n\nexport function resolveRevisionBeforeMessage"
replacement="""function resolveRevisionThrough(context, maxLength, { commitActive = false, allowDurableFallback = true } = {}) {\n    const root = ensureRoot(context);\n    stabilizeAssistantUids(context);\n    const data = lineageData(context);\n    const chat = Array.isArray(context?.chat) ? context.chat : [];\n    const end = Math.max(0, Math.min(chat.length, Number.isInteger(Number(maxLength)) ? Number(maxLength) : chat.length));\n    const legacyFingerprints = chat.map(messageFingerprintLegacy);\n    const legacyPrefix = length => legacyHashLineage(legacyFingerprints.slice(0, length));\n    const previousActive = root.activeRevision;\n\n    let bestHead = null;\n    let bestLength = -1;\n    for (const [branchKey, head] of Object.entries(root.branchHeads)) {\n        if (!Number.isInteger(head?.revision) || !getRevision(root, head.revision)) continue;\n        const length = Number.isInteger(head.length) ? head.length : Number.parseInt(String(branchKey).split(':', 1)[0], 10);\n        if (!Number.isInteger(length) || length < 0 || length > end || length <= bestLength) continue;\n        const expectedKey = (head.lineageVersion ?? 1) === LINEAGE_VERSION ? data.prefixKeys[length] : legacyPrefix(length);\n        if (expectedKey !== branchKey) continue;\n        bestHead = head;\n        bestLength = length;\n    }\n\n    let revision = bestHead?.revision ?? 0;\n    const startIndex = bestLength >= 0 ? bestLength : 0;\n    if (bestHead && commitActive) bestHead.touchedAt = Date.now();\n    for (let index = startIndex; index < end; index++) {\n        const message = chat[index];\n        if (!message) continue;\n        if (message.is_user || message.is_system) {\n            revision = checkpointRevisionIfValid(context, root, index, revision, true, data, legacyFingerprints);\n            continue;\n        }\n        const meta = activeMessageMeta(message);\n        if (!meta) continue;\n        const expectedLineageHash = expectedMetaHash(context, index, meta, data, legacyFingerprints);\n        if (!validMessageRevision(root, meta, revision, expectedLineageHash)) {\n            const recovered = materializePortableAssistant(context, root, index, revision, meta, data, legacyFingerprints);\n            if (recovered === null) break;\n            revision = recovered;\n            continue;\n        }\n        revision = meta.revision;\n        revision = checkpointRevisionIfValid(context, root, index, revision, true, data, legacyFingerprints);\n    }\n\n    // Revision 0 is the pristine empty state. Once an explicit seed/admin revision exists,\n    // missing or deleted metadata must never make a branch appear as if inventory never existed.\n    if (revision === 0 && allowDurableFallback && Number.isInteger(root.durableRevision) && getRevision(root, root.durableRevision)) {\n        revision = root.durableRevision;\n    }\n\n    if (commitActive) {\n        root.activeRevision = revision;\n        compactRevisions(root);\n        compactPortableCheckpointsWithRoot(context, root);\n    } else {\n        root.activeRevision = getRevision(root, previousActive) ? previousActive : revision;\n    }\n    return revision;\n}\n\nexport function resolveRevisionBeforeMessage"""
text=sub_once(text,pattern,replacement,'fallback resolver',re.S)
write(path,text)

# Update changelog terminology produced by the first transform.
path='CHANGELOG.md'
text=read(path)
text=once(text,
'- Uses the durable revision as the resolver floor, so losing a tail-message checkpoint can no longer collapse an established inventory to revision 0.\n',
'- Uses the durable revision only as an anti-empty fallback, so valid swipe branches keep their own state while missing/deleted anchors can no longer collapse an established inventory to revision 0.\n',
'changelog fallback wording')
write(path,text)

# Replace runtime static expectation from hard floor to fallback.
path='tests/v037-runtime-static.test.js'
text=read(path)
text=text.replace("test('durable floor is wired into branch resolution and administrative reconciliation', () => {", "test('durable fallback is wired into branch resolution and administrative reconciliation', () => {", 1)
text=text.replace("  assert.match(state, /bestHead\\?\\.revision \\?\\? floorRevision/);", "  assert.match(state, /revision === 0 && allowDurableFallback/);", 1)
write(path,text)

print('v0.3.7 compatibility correction complete')
