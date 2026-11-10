// b2-timeline: seeded chaos over the chat timeline on the testkit with all four modules.
import fsSync from 'node:fs';
// usage: node fuzz.mjs <seedFrom> <seedTo> <steps> [--stop] [--only=op,op]
// After every step: #1 rebuild == live (oracle strict replay + fresh store), #2 recorded states,
// #7 saved chat == live when clean.
import { allHost, persist, storeMod, fakeSt, seededMod } from './lib/host.mjs';
const B = process.env.B2ROOT ?? '/home/user/_break/b2-timeline';
const { rebuildAt } = await import(`${B}/Story_block/tests/v2/qa/helpers/oracle.js`);
const { readRecord } = persist;
const { createStore } = storeMod;
const { aiMessage } = fakeSt;
const { prng, seedCrypto } = seededMod;

const args = process.argv.slice(2);
const SEED_FROM = Number(args[0] ?? 1), SEED_TO = Number(args[1] ?? SEED_FROM), STEPS = Number(args[2] ?? 200);
const STOP = args.includes('--stop');
const ONLY = (args.find(a => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const VERBOSE = args.includes('-v');

const plain = v => (v === null || v === undefined ? v ?? null : JSON.parse(JSON.stringify(v)));
const J = v => JSON.stringify(plain(v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const isCarrier = m => m && typeof m === 'object' && !m.is_user;
const carriers = chat => chat.map((m, i) => (isCarrier(m) ? i : -1)).filter(i => i >= 0);

const ITEMS = ['Rope', 'Lamp', 'Iron Key', 'Apple', 'Torch', 'Minor Healing Draught', 'Iron Sword'];
const PLACES = ['Bluewatch Village', 'The Weir', 'Old Mill'];
const PEOPLE = ['Fenna', 'Kael', 'Lyra'];
const LONG = n => 'x'.repeat(n);

function line(r, big) {
    switch (r.int(0, 16)) {
        case 0: case 1: return `+ item ${r.pick(ITEMS)} | qty: ${r.int(1, 3)}${big ? ` | note: ${LONG(r.int(100, 400))}` : ''}`;
        case 2: return `- item ${r.pick(ITEMS)} | qty: ${r.int(1, 2)}`;
        case 3: return `+ coin ${r.int(1, 30)} | from: ${r.pick(PEOPLE)}`;
        case 4: return `- coin ${r.int(1, 12)} | to: ${r.pick(PEOPLE)}`;
        case 5: return `~ place ${r.pick(PLACES)} | kind: settlement`;
        case 6: return `${r.pick(['+', '-'])} present ${r.pick(PEOPLE)}`;
        case 7: return `+ quest Find ${r.pick(ITEMS)} — a job | giver: ${r.pick(PEOPLE)} | goal: get it | reward: 10 coin`;
        case 8: return `+ hook Rumor ${r.int(1, 9)} — an open thread`;
        case 9: return `! time +${r.int(1, 5)}h`;
        case 10: return `~ wound Ren — a fall | harm: ${r.pick(['scratch', 'wound'])}`;
        case 11: return `+ faction Guild ${r.int(1, 4)} — merchants | stance: neutral`;
        case 12: return `+ landmark ${r.pick(['Old Tower', 'Ruined Gate', 'Moss Cave'])} | region: north | kind: ruin`;
        case 13: return `+ world Storm ${r.int(1, 3)} — a storm comes | state: looming`;
        case 14: return `? check athletics — climb | dc: easy | who: Ren`;
        case 15: return `! rest short — by the fire`;
        default: return `+ item ${r.pick(ITEMS)}`;
    }
}
function replyText(r, step, big = false) {
    const story = `Reply ${step}: the story goes on.`;
    if (r.chance(0.15)) return story;
    const lines = Array.from({ length: r.int(1, 5) }, () => line(r, big));
    return `${story}\n<Changes>\n${lines.join('\n')}\n</Changes>`;
}

async function runSeed(seed) {
    const restore = seedCrypto(seed);
    const r = prng(seed);
    const origWarn = console.warn, origErr = console.error;
    const consoleErrors = [];
    console.warn = () => {};
    console.error = (...a) => consoleErrors.push(a.map(String).join(' '));
    const h = await allHost();
    const { st, ctx, store, sdk, turn } = h;
    const validate = typeof h.registry.validator === 'function' ? (state, names) => names.flatMap(name => {
        const fn = h.registry.validator(name);
        if (typeof fn !== 'function') return [];
        try { const e = fn(state?.domains?.[name], state); return Array.isArray(e) ? e.map(String) : []; } catch (error) { return [`The ${name} check failed: ${error?.message ?? error}`]; }
    }) : null;
    const mkStore = chatFn => createStore({ chat: chatFn, save: async () => {}, ...(validate ? { validate } : {}), ...(typeof h.registry.scratch === 'function' ? { scratch: name => h.registry.scratch(name) } : {}) });
    const log = [];
    const violations = [];
    let uid = 0;
    const tag = m => { if (m && m.__fz === undefined) m.__fz = ++uid; return m?.__fz; };
    // recorded[`${fz}:${swipe}`] = state JSON when that carrier/swipe last was the head (#2)
    let recorded = new Map();
    const key = m => `${tag(m)}:${Number.isInteger(m?.swipe_id) ? m.swipe_id : 0}`;
    const files = new Map();       // chatId -> the chat as last written to disk
    let saveMode = 'ok';           // ok | fail | slow | swallow
    let saveDelay = 0;
    const realSave = ctx.saveChat;
    ctx.saveChat = async () => {
        if (saveMode === 'fail') { saveMode = 'ok'; throw new Error('fake failure'); }
        if (saveMode === 'swallow') { saveMode = 'ok'; return; }   // ST saveChatConditional: error swallowed
        const snap = structuredClone(ctx.chat);
        const id = ctx.chatId;
        if (saveDelay) await sleep(saveDelay);
        st.saves.push(snap);
        files.set(id, snap);
    };
    void realSave;

    const fail = (what, detail = '') => {
        const v = { seed, step: log.length, op: log.at(-1), what, detail: String(detail).slice(0, 600) };
        violations.push(v);
        if (VERBOSE) origErr('VIOLATION', JSON.stringify(v));
    };

    const head = () => { try { return store.head(); } catch (e) { fail('head() threw', e.message); return null; } };

    function check(label, { expectRecorded = true, skip = new Set() } = {}) {
        const chat = ctx.chat;
        const idx = carriers(chat);
        // #1 oracle per carrier
        for (const i of idx) {
            let live;
            try { live = store.at(i); } catch (e) { fail(`at(${i}) threw`, e.message); continue; }
            const want = rebuildAt(chat, i).state;
            if (J(live) !== J(want)) fail(`#1 at(${i}) != strict rebuild`, `${label}`);
        }
        const fresh = mkStore(() => structuredClone(chat));
        if (J(fresh.head()) !== J(head())) {
            fail('#1 fresh store head != live head', `${label}: live->fresh ${diff(J(head()), J(fresh.head()))} | fresh problems ${J(fresh.problems())} live problems ${J(store.problems())}`);
            if (process.env.DUMPFRESH && !globalThis.__dumped) { globalThis.__dumped = 1; fsSync.writeFileSync('dumps/fresh.json', JSON.stringify({ chat, live: head(), fresh: fresh.head(), log }, null, 1)); }
        }
        // #2 recorded
        if (expectRecorded) {
            for (const i of idx) {
                const k = key(chat[i]);
                if (!recorded.has(k) || skip.has(k)) continue;
                const live = J(store.at(i));
                if (live !== recorded.get(k)) {
                    fail(`#2 carrier ${i} (${k}) differs from its recorded state`, `${label}: ${diff(recorded.get(k), live)}`);
                    recorded.set(k, live);
                }
            }
        }
        for (const i of idx) { const k = key(chat[i]); if (skip.has(k)) recorded.set(k, J(store.at(i))); }
        // record current head
        const hi = store.headIndex();
        if (hi >= 0) recorded.set(key(chat[hi]), J(head()));
        // #7: clean store => last save holds the live head
        if (!store.dirty() && files.has(ctx.chatId)) {
            const saved = files.get(ctx.chatId);
            const savedHead = mkStore(() => structuredClone(saved)).head();
            if (J(savedHead) !== J(head())) fail('#7 clean store but saved head != live head', `${label}: ${diff(J(head()), J(savedHead))}`);
        }
    }
    let lastSavedChatId = ctx.chatId;
    // loading a chat = reading its file
    const origLoad = st.loadChat;
    // SillyTavern's ensureSwipes on load: a missing swipe_info entry is backfilled with an empty extra
    const ensureSwipes = chat => { for (const m of chat) { if (!m || m.is_user || !Array.isArray(m.swipes)) continue; if (!Array.isArray(m.swipe_info)) m.swipe_info = []; for (let i = 0; i < m.swipes.length; i++) if (!m.swipe_info[i] || typeof m.swipe_info[i] !== 'object') m.swipe_info[i] = { send_date: '', extra: {} }; } return chat; };
    st.loadChat = async (chat, id = ctx.chatId) => { files.set(id, structuredClone(chat)); return origLoad(ensureSwipes(structuredClone(chat)), id); };
    const stSave = () => ctx.saveChat().catch(() => {});   // SillyTavern's own save after a delete/edit/swipe
    function diff(a, b) {
        const A = JSON.parse(a ?? 'null'), Bv = JSON.parse(b ?? 'null');
        const out = [];
        const walk = (x, y, p) => {
            if (out.length > 4) return;
            if (JSON.stringify(x) === JSON.stringify(y)) return;
            if (x && y && typeof x === 'object' && typeof y === 'object') {
                for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${p}/${k}`);
            } else out.push(`${p}: ${JSON.stringify(x)?.slice(0, 80)} -> ${JSON.stringify(y)?.slice(0, 80)}`);
        };
        walk(A, Bv, '');
        return out.join('; ');
    }
    // forget recorded states of carriers at or after index (a middle delete / edit changes them legitimately)
    function forgetFrom(index) {
        const keep = new Map();
        for (const [k, v] of recorded) keep.set(k, v);
        for (let i = index; i < ctx.chat.length; i++) {
            const m = ctx.chat[i];
            if (!isCarrier(m)) continue;
            for (const s of [...keep.keys()]) if (s.startsWith(`${tag(m)}:`)) keep.delete(s);
        }
        recorded = keep;
    }
    // mark identities of every message (cloned chats keep __fz)
    const tagAll = () => ctx.chat.forEach(tag);

    const lastIsCarrier = () => ctx.chat.length > 0 && isCarrier(ctx.chat.at(-1));
    const wrap = async (name, fn) => {
        log.push(name);
        try { return await fn(); } catch (e) { fail(`threw in ${name}`, e?.stack ?? e); return null; }
    };

    // the hero first (RB canGenerate)
    await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
    await sdk.command('scene.place', { name: 'Bluewatch Village', kind: 'settlement' });
    await store.flush();
    tagAll();
    check('start');

    const OPS = {
        async send(step) { await h.send(`User ${step}.`, replyText(r, step, r.chance(0.15))); },
        async group(step) {     // a second carrier in a row (group chat: another character answers)
            await st.generate('normal', { reply: replyText(r, step) });
            const m = ctx.chat.at(-1); m.name = r.pick(['Fenna', 'Kael']);
        },
        async ui() {
            const head0 = head();
            const stacks = Object.values(head0?.domains?.inventory?.stacks ?? {});
            const who = r.pick(['Ann', 'Bo', 'Cy']);
            const choices = [['scene.present', { add: who }], ['scene.present', { remove: who }]];
            if (stacks.length) choices.push(['inventory.drop', { stack: r.pick(stacks).id, qty: 1 }]);
            const [t, p] = r.pick(choices);
            await sdk.command(t, p);
            if (r.chance(0.4)) await sleep(450);       // let the scheduled save fire
        },
        async swipe(step) { if (lastIsCarrier() && ctx.chat.length > 1) await h.swipe(replyText(r, step)); },
        async stSwipe(step) {      // SillyTavern's own new-swipe path (non-streaming saveReply)
            if (!lastIsCarrier() || ctx.chat.length < 2) return;
            const last = ctx.chat.length - 1, m = ctx.chat[last];
            // syncMesToSwipe
            if (Array.isArray(m.swipe_info) && m.swipe_info[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
            m.swipe_id = m.swipes.length;
            delete m.extra.memory; delete m.extra.display_text;
            await st.eventSource.emit('message_swiped', last);
            await turn.interceptor(structuredClone(ctx.chat), 8192, () => {}, 'swipe');
            await turn.onPromptReady({ chat: [{ role: 'system', content: 'x' }], dryRun: false });
            m.swipes.length++;
            m.mes = replyText(r, step);
            await st.eventSource.emit('message_received', last, 'swipe');
            m.swipes[m.swipe_id] = m.mes;
            m.swipe_info[m.swipe_id] = { send_date: '', extra: structuredClone(m.extra) };
            await st.eventSource.emit('generation_ended', ctx.chat.length);
            await stSave();
        },
        async swipeTo() {
            const i = ctx.chat.length - 1, m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1)) return;
            let s = r.int(0, m.swipes.length - 1);
            if (s === m.swipe_id) s = (s + 1) % m.swipes.length;
            if (m.swipe_info?.[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra); // syncMesToSwipe
            await st.swipeTo(i, s);
            await stSave();
        },
        async swipeDelete() {      // ST deleteSwipe: splice swipes + swipe_info, show a neighbour
            const i = ctx.chat.length - 1, m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1)) return;
            const del = m.swipe_id;
            const fz = tag(m);
            const moved = new Map();
            for (const [k, v] of recorded) {
                const [a, b] = k.split(':').map(Number);
                if (a !== fz) { moved.set(k, v); continue; }
                if (b < del) moved.set(k, v); else if (b > del) moved.set(`${a}:${b - 1}`, v);
            }
            recorded = moved;
            m.swipes.splice(del, 1);
            m.swipe_info.splice(del, 1);
            const now = Math.max(0, Math.min(del, m.swipes.length - 1) - (r.chance(0.5) ? 1 : 0));
            m.swipe_id = now;
            m.mes = m.swipes[now];
            m.extra = structuredClone(m.swipe_info[now]?.extra ?? {});
            await st.eventSource.emit('message_swipe_deleted', { messageId: i, swipeId: del, newSwipeId: now });
            await stSave();
        },
        async regenerate(step) { if (ctx.chat.length > 1) await h.regenerate(replyText(r, step)); },
        async cont(step) { if (lastIsCarrier() && ctx.chat.length > 1) await h.cont(r.chance(0.5) ? `\nmore\n<Changes>\n${line(r)}\n</Changes>` : ' more.'); },
        async deleteLast() { if (ctx.chat.length > 1) { await st.deleteMessage(ctx.chat.length - 1); await stSave(); } },
        async deleteMiddle() {
            if (ctx.chat.length < 4) return;
            const i = r.int(1, ctx.chat.length - 2);
            forgetFrom(i);
            await st.deleteMessage(i);
            await stSave();
            return 'nocheck2';
        },
        async deleteMany() {      // ST delete mode: from a message to the end
            if (ctx.chat.length < 3) return;
            const from = r.int(1, ctx.chat.length - 1);
            ctx.chat.splice(from);
            await st.eventSource.emit('message_deleted', ctx.chat.length);
            await stSave();
        },
        async editReply() {
            const idx = carriers(ctx.chat).filter(i => i > 0);
            if (!idx.length) return;
            const i = r.pick(idx);
            await st.editMessage(i, `${ctx.chat[i].mes}\n<Changes>\n${line(r)}\n</Changes>`);
            await stSave();
        },
        async editUser() {
            const idx = ctx.chat.map((m, i) => (m.is_user ? i : -1)).filter(i => i >= 0);
            if (idx.length) { await st.editMessage(r.pick(idx), `edited ${r.int(1, 99)} <Changes>\n+ coin 999\n</Changes>`); await stSave(); }
        },
        async branch() {
            const idx = carriers(ctx.chat);
            if (!idx.length) return;
            const i = r.pick(idx);
            const want = J(store.at(i));
            await store.flush().catch(() => {});
            await ctx.branchChat(i);
            tagAll();
            if (J(head()) !== want) fail('#2 branch head != state at branch point', diff(want, J(head())));
            lastSavedChatId = null;
        },
        async rewind() {
            const idx = carriers(ctx.chat).filter(i => (readRecord(ctx.chat[i])?.receipts?.length ?? 0) > 0);
            if (!idx.length) return;
            const i = r.pick(idx);
            const recs = readRecord(ctx.chat[i]).receipts;
            const rec = r.pick(recs);
            const k = key(ctx.chat[i]);
            const res = await sdk.rewind({ index: i, beforeRev: rec.rev });
            recorded.delete(k);
            tagAll();
            lastSavedChatId = null;
            if (res?.ok) {
                // expected: state before i + the kept ops, i.e. the head's rev is rec.rev - 1
                if (head()?.meta?.rev !== rec.rev - 1) fail('#2 rewind head rev != beforeRev-1', `${head()?.meta?.rev} vs ${rec.rev - 1}`);
            } else if (res?.code !== 'STALE') {
                fail('rewind refused', J(res));
                if (process.env.DUMP) { const fs = await import('node:fs'); fs.writeFileSync('dump-rewind.json', JSON.stringify({ i, beforeRev: rec.rev, chat: ctx.chat, old: st.chats }, null, 1)); }
            }
        },
        async reload() {
            const saved = files.get(ctx.chatId);
            if (!saved) return;
            const wasDirty = store.dirty();
            const before = J(head());
            await st.loadChat(saved, ctx.chatId);
            tagAll();
            if (!wasDirty && J(head()) !== before) fail('#7 reload from saved != live before reload', diff(before, J(head())));
            return 'nocheck2';
        },
        async newChat() {
            const kind = r.pick(['empty', 'greeting', 'other']);
            lastSavedChatId = null;
            if (kind === 'empty') await st.loadChat([], `empty-${uid}`);
            else if (kind === 'greeting') await st.loadChat([aiMessage('Hello there.', { name: 'Narrator' })], `greet-${uid}`);
            else await st.loadChat([aiMessage('Other chat.'), { name: 'You', is_user: true, mes: 'hi', extra: {} }], `other-${uid}`);
            tagAll();
            await sdk.command('party.create', { name: 'Ren', preset: 'fighter' }).catch(() => null);
        },
        async corrupt() {
            const idx = carriers(ctx.chat).filter(i => readRecord(ctx.chat[i]));
            if (!idx.length) return;
            const i = r.pick(idx);
            const m = ctx.chat[i];
            const rec = m.extra.storySuite;
            const how = r.pick(['v', 'noOps', 'truncOps', 'badOp', 'swipeInfo', 'noCheckpoint', 'emptyCheckpoint', 'narratedJunk', 'spansJunk', 'string']);
            log[log.length - 1] += `:${how}@${i}`;
            if (how === 'v') rec.v = r.pick([1, '2', 3, null]);
            else if (how === 'noOps') delete rec.ops;
            else if (how === 'truncOps') rec.ops = rec.ops.slice(0, Math.floor(rec.ops.length / 2));
            else if (how === 'badOp') rec.ops.push({ op: 'replace', path: '/domains/nope/x', value: 1 });
            else if (how === 'swipeInfo') { m.swipe_info = m.swipe_info?.slice(0, 1) ?? []; m.swipe_id = (m.swipes?.length ?? 1) - 1; }
            else if (how === 'noCheckpoint') delete rec.checkpoint;
            else if (how === 'emptyCheckpoint') { if (rec.checkpoint) rec.checkpoint = {}; }
            else if (how === 'narratedJunk') rec.narrated = [null, 5, { a: 1 }];
            else if (how === 'spansJunk') rec.spans = 'nope';
            else if (how === 'string') m.extra.storySuite = JSON.stringify(rec).slice(0, 50);
            // a hand-edited chat file: it is what is on disk, and the chat is opened from it
            forgetFrom(i);
            const file = structuredClone(ctx.chat);
            await st.loadChat(file, ctx.chatId);
            tagAll();
            return 'nocheck2';
        },
        async saveFail(step) {
            saveMode = r.pick(['fail', 'swallow']);
            if (process.env.NOSWALLOW && saveMode === 'swallow') saveMode = 'fail';
            const mode = saveMode;
            log[log.length - 1] += `:${mode}`;
            await sdk.command('scene.present', { add: `P${step}` });
            const want = J(head());
            await sleep(450);
            if (mode === 'swallow' && !store.dirty()) {
                // the saved file does not hold the command but the store thinks it is saved
                const saved = st.saves.at(-1);
                const sh = saved ? J(mkStore(() => structuredClone(saved)).head()) : null;
                if (sh !== want) fail('#7 a save that did not happen (ST swallows save errors) left the store clean', `saved rev ${JSON.parse(sh ?? 'null')?.meta?.rev} live rev ${head()?.meta?.rev}`);
                // repair the fixture so later #7 checks stay meaningful
                await ctx.saveChat();
            }
            saveMode = 'ok';
            await h.send(`User ${step}.`, replyText(r, step));
        },
        async slowRace(step) {     // a save racing the next generation
            saveDelay = r.int(5, 40);
            await sdk.command('scene.present', { add: `P${step}` });
            await sleep(r.int(380, 420));
            const p = h.send(`User ${step}.`, replyText(r, step));
            if (r.chance(0.5)) await sdk.command('scene.present', { remove: `P${step}` });
            await p;
            await sleep(60);
            saveDelay = 0;
        },
        async bigReply(step) { await h.send(`User ${step}.`, replyText(r, step, true)); },
        async death(step) {
            const res = await h.send(`User ${step}.`, `A wolf pack!\n<Changes>\n! encounter 3 Wolf — circling | tier: deadly | stakes: death\n</Changes>`);
            for (let n = 0; n < 200; n++) {
                const s = sdk.query('combat.session');
                if (!s || s.status !== 'active') break;
                const a = await sdk.command('combat.act', { action: { type: 'auto' } });
                if (!a.ok) break;
            }
            const point = (() => { try { return sdk.query('return.point'); } catch { return null; } })();
            if (point) {
                const RB = await import(`${B}/rpg_battle/src/v2/return/index.js`);
                const out = await RB.returnInTime(sdk);
                tagAll();
                lastSavedChatId = null;
                if (!out.ok) fail('death return failed', J(out));
                else if (sdk.query('combat.session')?.status === 'active') fail('after return the fight is still active');
            }
            void res;
        },
    };
    const WEIGHTS = { send: 20, group: 3, ui: 8, swipe: 7, stSwipe: 5, swipeTo: 8, swipeDelete: 3, regenerate: 5, cont: 4, deleteLast: 5,
        deleteMiddle: 3, deleteMany: 2, editReply: 3, editUser: 2, branch: 2, rewind: 3, reload: 4, newChat: 1, corrupt: 2, saveFail: 2,
        slowRace: 2, bigReply: 3, death: 1 };
    if (process.env.PROFILE === 'cp') Object.assign(WEIGHTS, { send: 30, bigReply: 25, group: 5, deleteMany: 0.2, newChat: 0, corrupt: 0, deleteMiddle: 1, death: 0.5, saveFail: 0.5 });
    if (process.env.PROFILE === 'long') Object.assign(WEIGHTS, { send: 30, bigReply: 8, deleteMany: 0.3, newChat: 0.1, deleteLast: 3, corrupt: 0.5 });
    const names = Object.keys(WEIGHTS).filter(n => !ONLY.length || ONLY.includes(n));
    const total = names.reduce((s, n) => s + WEIGHTS[n], 0);
    for (let step = 0; step < STEPS; step++) {
        let x = r() * total, op = names[0];
        for (const n of names) { x -= WEIGHTS[n]; if (x < 0) { op = n; break; } }
        const hiBefore = store.headIndex();
        const prevKey = hiBefore >= 0 ? key(ctx.chat[hiBefore]) : null;
        const dumpAt = process.env.DUMPAT ? process.env.DUMPAT.split(',').map(Number) : [];
        const fsx = dumpAt.length ? await import('node:fs') : null;
        if (dumpAt.includes(step)) fsx.writeFileSync(`dump-${seed}-${step}-before.json`, JSON.stringify({ op, chat: ctx.chat, recorded: [...recorded] }, null, 1));
        const out = await wrap(op, () => OPS[op](step));
        if (dumpAt.includes(step)) fsx.writeFileSync(`dump-${seed}-${step}-after.json`, JSON.stringify({ op, chat: ctx.chat, chatId: ctx.chatId, file: files.get(ctx.chatId), dirty: store.dirty() }, null, 1));
        tagAll();
        if (op === 'reload' || op === 'branch' || op === 'rewind' || op === 'newChat' || op === 'death') lastSavedChatId = ctx.chatId;
        const t0 = performance.now();
        const RESTORE = new Set(['swipeTo', 'swipeDelete', 'deleteLast', 'deleteMany', 'reload', 'editReply', 'editUser', 'branch']);
        const skip = new Set();
        if (!RESTORE.has(op)) {
            if (prevKey) skip.add(prevKey);
            const hi = store.headIndex();
            if (hi >= 0) skip.add(key(ctx.chat[hi]));
            const before = carriers(ctx.chat).filter(i => i < hi).at(-1);
            if (before !== undefined) skip.add(key(ctx.chat[before]));   // a cue before the reply lands there
        }
        check(`${step}:${op}`, { expectRecorded: out !== 'nocheck2', skip });
        const dt = performance.now() - t0;
        if (VERBOSE && step % 50 === 0) origErr(`seed ${seed} step ${step} len ${ctx.chat.length} rev ${head()?.meta?.rev} check ${dt.toFixed(0)}ms`);
        for (const p of turn.problems()) if (/could not be kept|could not be built/.test(p.message)) fail('turn problem', p.message);
        turn.clearProblems();
        if (STOP && violations.length) break;
    }
    h.close();
    console.warn = origWarn; console.error = origErr;
    restore();
    const cps = ctx.chat.filter(m => readRecord(m)?.checkpoint).length;
    return { violations, log, consoleErrors, len: ctx.chat.length, cps, bytes: JSON.stringify(ctx.chat).length };
}

const all = [];
for (let seed = SEED_FROM; seed <= SEED_TO; seed++) {
    const out = await runSeed(seed);
    const kinds = {};
    for (const v of out.violations) kinds[v.what.replace(/\d+/g, 'N')] = (kinds[v.what.replace(/\d+/g, 'N')] ?? 0) + 1;
    console.log(`seed ${seed}: ${out.violations.length} violations, chat ${out.len} msgs, ${out.cps} checkpoints, ${out.bytes} bytes`, JSON.stringify(kinds));
    for (const v of out.violations.slice(0, 3)) console.log("   ", JSON.stringify(v));
    if (process.env.LOG) console.log(out.log.map((o, i) => `${i}:${o}`).join(" "));
    all.push(...out.violations);
}
const byKind = {};
for (const v of all) { const k = v.what.replace(/\d+/g, 'N'); (byKind[k] ??= []).push(`${v.seed}@${v.step}:${v.op}`); }
console.log('\nSUMMARY');
for (const [k, list] of Object.entries(byKind)) console.log(`${list.length}\t${k}\t${list.slice(0, 6).join(' ')}`);
process.exit(0);
