// Rebuild from a saved chat file and compare with the live head (invariant #1).
// usage: node rebuild.mjs <chat.jsonl> <live-head.json> [--json out.json]
// Checks: (a) the store's head from the file == the live head; (b) a full replay from the greeting's
// checkpoint, ignoring later checkpoints, gives the same head and matches every later checkpoint;
// (c) message.extra.storySuite == swipe_info[swipe_id].extra.storySuite on every carrier; (d) the store's
// replay problems. Prints a JSON report.
import fs from 'node:fs';
const REPOS = process.env.SOAK_REPOS ?? '/home/user/soak';
const { createStore } = await import(`${REPOS}/Story_block/src/v2/store.js`);
const { apply } = await import(`${REPOS}/Story_block/src/v2/ops.js`);

const [file, headFile] = process.argv.slice(2);
const outAt = process.argv.indexOf('--json');
const canon = value => JSON.stringify(value, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v));

function firstDiff(a, b, path = '') {
    if (canon(a) === canon(b)) return null;
    if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
        const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
        for (const k of keys) {
            const d = firstDiff(a[k], b[k], `${path}/${k}`);
            if (d) return d;
        }
    }
    return { path: path || '/', file: JSON.stringify(a)?.slice(0, 300), live: JSON.stringify(b)?.slice(0, 300) };
}

const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
const header = JSON.parse(lines[0]);
const chat = lines.slice(1).map(l => JSON.parse(l));
const live = headFile ? JSON.parse(fs.readFileSync(headFile, 'utf8')) : null;
const store = createStore({ chat: () => chat, save: async () => {} });
const t0 = performance.now();
const head = store.head();
const rebuildMs = performance.now() - t0;
const report = { file, messages: chat.length, carriers: chat.filter(m => !m.is_user).length, rebuildMs: Math.round(rebuildMs * 10) / 10 };
report.storeProblems = store.problems();
report.headEqualsLive = live ? canon(head) === canon(live) : null;
if (live && !report.headEqualsLive) report.headDiff = firstDiff(head, live);

// Full replay from the first checkpoint, ignoring the later ones.
let state = null;
const checkpointMismatch = [];
const replayErrors = [];
let checkpoints = 0;
let records = 0;
for (let i = 0; i < chat.length; i += 1) {
    const rec = chat[i].extra?.storySuite;
    if (!rec || chat[i].is_user) continue;
    records += 1;
    if (rec.checkpoint) {
        checkpoints += 1;
        if (state === null) state = structuredClone(rec.checkpoint);
        else if (canon(state) !== canon(rec.checkpoint)) checkpointMismatch.push({ index: i, diff: firstDiff(rec.checkpoint, state) });
    }
    if (state === null) continue;
    try { state = apply(state, structuredClone(rec.ops ?? [])); } catch (e) { replayErrors.push({ index: i, error: e.message.slice(0, 200) }); }
}
report.records = records;
report.checkpoints = checkpoints;
report.fullReplayEqualsLive = live ? canon(state) === canon(live) : null;
if (live && !report.fullReplayEqualsLive) report.fullReplayDiff = firstDiff(state, live);
report.fullReplayEqualsStore = canon(state) === canon(head);
report.checkpointMismatch = checkpointMismatch.slice(0, 10);
report.checkpointMismatchCount = checkpointMismatch.length;
report.replayErrors = replayErrors.slice(0, 10);
report.replayErrorCount = replayErrors.length;

// swipe_info copies in step with extra.
const swipeMismatch = [];
for (let i = 0; i < chat.length; i += 1) {
    const m = chat[i];
    if (m.is_user || !m.extra?.storySuite || !Array.isArray(m.swipe_info)) continue;
    const si = m.swipe_info[m.swipe_id ?? 0]?.extra?.storySuite;
    if (si !== undefined && canon(si) !== canon(m.extra.storySuite)) swipeMismatch.push(i);
}
report.swipeInfoMismatch = swipeMismatch.slice(0, 20);
report.swipeInfoMismatchCount = swipeMismatch.length;

// Sizes.
let ss = 0, ssSwipes = 0, cp = 0, ops = 0, receipts = 0;
for (const m of chat) {
    const rec = m.extra?.storySuite;
    if (rec) {
        ss += JSON.stringify(rec).length;
        if (rec.checkpoint) cp += JSON.stringify(rec.checkpoint).length;
        ops += JSON.stringify(rec.ops ?? []).length;
        receipts += JSON.stringify(rec.receipts ?? []).length;
    }
    for (const si of m.swipe_info ?? []) if (si?.extra?.storySuite) ssSwipes += JSON.stringify(si.extra.storySuite).length;
}
report.bytes = { file: fs.statSync(file).size, storySuite: ss, storySuiteInSwipeInfo: ssSwipes, checkpoints: cp, ops, receipts, head: JSON.stringify(head ?? null).length };
report.headRev = head?.meta?.rev ?? null;
report.liveRev = live?.meta?.rev ?? null;
report.chatMetadataKeys = Object.keys(header.chat_metadata ?? {});
// (e) The real runtime: Story Block with all four modules and the Ersveil pack (their validators and replay
// rules), the chat loaded as SillyTavern would after a reload. This is what a reader gets back.
try {
    process.env.STORY_SUITE_ROOT ??= REPOS;
    const { webcrypto } = await import('node:crypto');
    const { suiteHost } = await import('./suite-host.mjs');
    const warn = console.warn; console.warn = () => {};
    const t1 = performance.now();
    const host = await suiteHost();
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true, writable: true });
    await host.st.loadChat(chat, 'rebuild');
    const suiteHead = host.head();
    report.suiteMs = Math.round(performance.now() - t1);
    report.suiteEqualsLive = live ? canon(suiteHead) === canon(live) : null;
    if (live && !report.suiteEqualsLive) report.suiteDiff = firstDiff(suiteHead, live);
    report.suiteProblems = (host.store.problems?.() ?? []).map(p => ({ index: p.index, why: String(p.why).slice(0, 200) })).slice(0, 10);
    report.suiteEqualsStore = canon(suiteHead) === canon(head);
    host.close(); console.warn = warn;
} catch (error) { report.suiteError = String(error?.stack ?? error).slice(0, 400); }
console.log(JSON.stringify(report, null, 1));
if (outAt > 0) fs.writeFileSync(process.argv[outAt + 1], JSON.stringify(report, null, 1));
// The whole report also sits next to the snapshot (kept when a big chat copy is deleted).
try { fs.writeFileSync(file.replace(/\.jsonl$/, '') + '.rebuild.json', JSON.stringify(report)); } catch { /* read-only place */ }
