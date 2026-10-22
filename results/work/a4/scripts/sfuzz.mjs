// a4 storage fuzz: save / persist paths on the testkit with all four modules, saving through the real
// chat-file path to a fake server that fails (throw, sync throw, 500, integrity, hang, slow).
// usage: node sfuzz.mjs <seedFrom> <seedTo> <steps> [--stop] [--only=a,b] [-v]   PROFILE=cp for checkpoint-heavy
// Checks after every step: #1 fresh store over the live chat == live head; #7 a clean store with no save
// in flight has the live head on disk; after `recover` (server ok, hung saves let go, flush) the store is clean
// and the file holds the live head; reload / rename / card edit keep the head they had (after recovery).
import { makeServer, allHost, openFromServer, fileHead, freshHead, cardEdit, renameChat, persist, fakeSt, seededMod, sleep, J } from './lib.mjs';
const { readRecord } = persist;
const { aiMessage } = fakeSt;
const { prng, seedCrypto } = seededMod;

const args = process.argv.slice(2);
const SEED_FROM = Number(args[0] ?? 1), SEED_TO = Number(args[1] ?? SEED_FROM), STEPS = Number(args[2] ?? 120);
const STOP = args.includes('--stop');
const ONLY = (args.find(a => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean);
const VERBOSE = args.includes('-v');
const isCarrier = m => m && typeof m === 'object' && !m.is_user;
const carriers = chat => chat.map((m, i) => (isCarrier(m) ? i : -1)).filter(i => i >= 0);
const ITEMS = ['Rope', 'Lamp', 'Iron Key', 'Apple', 'Torch'];
const PEOPLE = ['Fenna', 'Kael', 'Lyra'];
const FAILS = ['throw', 'sync', '500', 'integrity', 'hangfail'];

function line(r, big) {
    switch (r.int(0, 8)) {
        case 0: case 1: return `+ item ${r.pick(ITEMS)} | qty: ${r.int(1, 3)}${big ? ` | note: ${'x'.repeat(r.int(200, 900))}` : ''}`;
        case 2: return `- item ${r.pick(ITEMS)} | qty: 1`;
        case 3: return `+ coin ${r.int(1, 30)} | from: ${r.pick(PEOPLE)}`;
        case 4: return `${r.pick(['+', '-'])} present ${r.pick(PEOPLE)}`;
        case 5: return `+ hook Rumor ${r.int(1, 99)} — an open thread`;
        case 6: return `! time +${r.int(1, 5)}h`;
        case 7: return `+ world Storm ${r.int(1, 3)} — a storm comes | state: looming`;
        default: return `+ item ${r.pick(ITEMS)}`;
    }
}
const replyText = (r, step, big = false) => (r.chance(0.1) ? `Reply ${step}.` : `Reply ${step}: on.\n<Changes>\n${Array.from({ length: r.int(1, 4) }, () => line(r, big)).join('\n')}\n</Changes>`);

function diff(a, b) {
    const out = [];
    const walk = (x, y, p) => {
        if (out.length > 4 || JSON.stringify(x) === JSON.stringify(y)) return;
        if (x && y && typeof x === 'object' && typeof y === 'object') for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${p}/${k}`);
        else out.push(`${p}: ${JSON.stringify(x)?.slice(0, 70)} -> ${JSON.stringify(y)?.slice(0, 70)}`);
    };
    walk(JSON.parse(a ?? 'null'), JSON.parse(b ?? 'null'), '');
    return out.join('; ');
}
const within = (p, ms = 8000) => Promise.race([p, sleep(ms).then(() => { throw new Error(`stuck > ${ms} ms`); })]);

async function runSeed(seed) {
    const restore = seedCrypto(seed);
    const r = prng(seed);
    const origWarn = console.warn, origErr = console.error;
    console.warn = () => {};
    console.error = () => {};
    const server = makeServer();
    const h = await allHost({ server });
    const { st, ctx, store, sdk, turn } = h;
    const log = [];
    const violations = [];
    const fail = (what, detail = '') => {
        const v = { seed, step: log.length - 1, op: log.at(-1), what, detail: String(detail).slice(0, 500) };
        violations.push(v);
        if (VERBOSE) origErr('VIOLATION', JSON.stringify(v));
        if (process.env.DBG) origErr('DBG', what, 'serverlog:', server.log.slice(-14).join(' '), '| ops:', log.slice(-4).join(' '));
    };
    const head = () => { try { return store.head(); } catch (e) { fail('head() threw', e.message); return null; } };
    let chatN = 0;
    await openFromServer(h, server, `chat-${seed}-${chatN}`);
    await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
    await sdk.command('scene.place', { name: 'Bluewatch Village', kind: 'settlement' });

    const failNext = (n = 1, mode = r.pick(FAILS)) => { server.mode = mode; server.fails = n; return mode; };
    async function recover(label) {
        server.fails = 0;
        server.release();
        for (let i = 0; i < 3; i++) {
            try { await within(store.flush()); break; } catch (e) { if (i === 2) fail('recover: flush keeps failing', `${label}: ${e.message}`); }
            server.release();
        }
        await sleep(0);
        if (store.dirty()) fail('recover: still dirty after a good flush', label);
        const live = J(head());
        const disk = J(fileHead(h, server, ctx.chatId));
        if (disk !== live) fail('#7 after recovery the file != live head', `${label}: file ${(server.files.get(ctx.chatId)?.length ?? 1) - 1} live ${ctx.chat.length} ${diff(live, disk)} | ${server.log.slice(-10).join(' ')}`);
    }
    function check(label) {
        const live = J(head());
        const fresh = J(freshHead(h, structuredClone(ctx.chat)));
        if (fresh !== live) fail('#1 fresh store over live chat != live head', `${label}: ${diff(live, fresh)}`);
        if (!store.dirty() && !store.pending?.() && server.hung.length === 0) {
            const disk = J(fileHead(h, server, ctx.chatId));
            if (disk !== live) {
                const f = server.files.get(ctx.chatId)?.slice(1) ?? [];
                const sameTexts = f.length === ctx.chat.length && f.every((m, i) => m.mes === ctx.chat[i].mes);
                fail(sameTexts ? '#7 clean store, file != live head' : '#7 clean store, file != live head (file messages differ)', `${label}: file ${f.length} live ${ctx.chat.length} ${diff(live, disk)} | ${server.log.slice(-8).join(' ')}`);
            }
        }
        for (const p of turn.problems()) if (/could not be kept|could not be built|was not saved/.test(p.message)) fail('turn problem', p.message);
        turn.clearProblems();
    }
    const sameTexts = () => { const f = server.files.get(ctx.chatId)?.slice(1) ?? []; return f.length === ctx.chat.length && f.every((m, i) => m.mes === ctx.chat[i].mes); };
    const lastIsCarrier = () => ctx.chat.length > 1 && isCarrier(ctx.chat.at(-1));
    const stSave = () => ctx.saveChat();
    const ui = () => {
        const stacks = Object.values(head()?.domains?.inventory?.stacks ?? {});
        const who = r.pick(['Ann', 'Bo', 'Cy', 'Dee']);
        const choices = [['scene.present', { add: who }], ['scene.present', { remove: who }]];
        if (stacks.length) choices.push(['inventory.drop', { stack: r.pick(stacks).id, qty: 1 }]);
        const [t, p] = r.pick(choices);
        return sdk.command(t, p);
    };
    // A timeline op SillyTavern can do between saves.
    const TIMELINE = {
        async swipeTo() {
            const i = ctx.chat.length - 1, m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1)) return;
            let s = r.int(0, m.swipes.length - 1);
            if (s === m.swipe_id) s = (s + 1) % m.swipes.length;
            if (m.swipe_info?.[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
            await st.swipeTo(i, s);
            await stSave();
        },
        async swipeDelete(which = null) {
            const i = ctx.chat.length - 1, m = ctx.chat[i];
            if (!isCarrier(m) || !(m.swipes?.length > 1) || i === 0) return;
            const del = which ?? m.swipe_id;
            if (m.swipe_info?.[m.swipe_id]) m.swipe_info[m.swipe_id].extra = structuredClone(m.extra);
            m.swipes.splice(del, 1);
            m.swipe_info.splice(del, 1);
            const now = Math.max(0, Math.min(m.swipe_id >= del ? m.swipe_id - (m.swipe_id === del ? 0 : 1) : m.swipe_id, m.swipes.length - 1));
            m.swipe_id = now;
            m.mes = m.swipes[now];
            m.extra = structuredClone(m.swipe_info[now]?.extra ?? {});
            await st.eventSource.emit('message_swipe_deleted', { messageId: i, swipeId: del, newSwipeId: now });
            await stSave();
        },
        async deleteLast() { if (ctx.chat.length > 2) { await st.deleteMessage(ctx.chat.length - 1); await stSave(); } },
        async deleteMiddle() {
            if (ctx.chat.length < 5) return;
            await st.deleteMessage(r.int(1, ctx.chat.length - 2));
            await stSave();
        },
    };

    const OPS = {
        async send(step) { await within(h.send(`User ${step}.`, replyText(r, step, r.chance(0.2)))); },
        async ui() { await within(ui()); },
        async ui2() { await within(Promise.all([ui(), ui()])); },
        async sendFail(step) {      // saves fail across several replies and commands, then recover
            const n = r.int(1, 6);
            log[log.length - 1] += `:${failNext(n)}x${n}`;
            for (let k = 0; k < r.int(1, 3); k++) {
                if (r.chance(0.5)) await within(ui());
                const p = h.send(`User ${step}.${k}`, replyText(r, `${step}.${k}`));
                                await within(p);
            }
            server.release();
            if (r.chance(0.5)) await recover(log.at(-1));
        },
        async uiDuringReplySave(step) {   // the reply's save hangs; a UI command comes in meanwhile
            server.mode = 'hang'; server.fails = 1;
            const p = h.send(`User ${step}.`, replyText(r, step));
            await sleep(1);
            const q = ui();
            const q2 = r.chance(0.3) ? ui() : null;
            await sleep(1);
            if (r.chance(0.3)) { failNext(1); }
            server.release();
            await sleep(1); server.release();
            await within(Promise.all([p, q, q2]));
            server.release();
        },
        async saveDuringTimeline() {      // a UI command whose save hangs while SillyTavern swipes / deletes
            server.mode = r.pick(process.env.REORDER ? ['hang', 'reorder', 'hangfail'] : ['hang', 'hang', 'hangfail']); server.fails = 1;
            const q = ui();
            await sleep(1);
            const op = r.pick(Object.keys(TIMELINE));
            log[log.length - 1] += `:${server.mode}:${op}`;
            await TIMELINE[op]();
            server.release();
            await within(q);
            server.release();
        },
        async swipe(step) { if (lastIsCarrier()) await within(h.swipe(replyText(r, step))); },
        async swipeTo() { await TIMELINE.swipeTo(); },
        async swipeDelete() { await TIMELINE.swipeDelete(); },
        async swipeDeleteOld() {          // the oldest swipe of the last reply
            const m = ctx.chat.at(-1);
            if (isCarrier(m) && m.swipes?.length > 2) await TIMELINE.swipeDelete(0);
        },
        async deleteLast() { await TIMELINE.deleteLast(); },
        async deleteMiddle() { await TIMELINE.deleteMiddle(); },
        async deleteCheckpoint() {        // delete the carrier that holds the latest checkpoint (not the greeting)
            const idx = carriers(ctx.chat).filter(i => i > 0 && readRecord(ctx.chat[i])?.checkpoint);
            if (!idx.length) return;
            const i = r.chance(0.7) ? idx.at(-1) : r.pick(idx);
            log[log.length - 1] += `@${i}/${ctx.chat.length}`;
            await st.deleteMessage(i);
            await stSave();
        },
        async regenerate(step) { if (ctx.chat.length > 2) await within(h.regenerate(replyText(r, step))); },
        async cont(step) { if (lastIsCarrier()) await within(h.cont(r.chance(0.5) ? `\nmore\n<Changes>\n${line(r)}\n</Changes>` : ' more.')); },
        async reload() {                  // the same chat read again from its file (maybe with a change unsaved)
            if (r.chance(0.5)) { failNext(1); await within(ui()); }
            const before = J(head());
            const textsKept = sameTexts();
            await openFromServer(h, server, ctx.chatId);
            await recover(`${log.at(-1)} (reload)`);
            const after = J(head());
            if (after !== before) fail(textsKept ? '#7 reload lost state' : '#7 reload lost state (file lacked messages)', diff(before, after));
        },
        async rename(step) {
            const event = !process.env.NORENAMEEVENT;
            const pendingMode = r.pick(['none', 'fail', 'window']);
            if (pendingMode === 'fail') { failNext(1); await within(ui()); }
            else if (pendingMode === 'window') await h.bus.command('scene.present', { add: `W${step}` }, { cause: 'ui' });
            log[log.length - 1] += `:${pendingMode}`;
            const before = J(head());
            const textsKept = sameTexts();
            if (process.env.DBG) origErr('rename: live len', ctx.chat.length, 'file len', (server.files.get(ctx.chatId)?.length ?? 1) - 1, 'file head rev', fileHead(h, server, ctx.chatId)?.meta?.rev, 'live rev', head()?.meta?.rev, 'log', server.log.slice(-12).join(' '));
            await renameChat(h, server, `chat-${seed}-r${step}`, { event });
            await sleep(450);
            await recover(`${log.at(-1)} (rename)`);
            const after = J(head());
            if (after !== before) fail(textsKept ? '#7 rename lost state' : '#7 rename lost state (file lacked messages)', diff(before, after));
        },
        async newChatCard(step) {         // a fresh chat: UI commands on the greeting, then the card is edited
            chatN++;
            const id = `chat-${seed}-${chatN}`;
            await openFromServer(h, server, id);
            await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
            const how = r.pick(['plain', 'fail', 'window', 'hang', 'reload']);
            log[log.length - 1] += `:${how}`;
            if (how === 'fail') { failNext(r.int(1, 3)); await within(ui()); }
            else if (how === 'window') await h.bus.command('scene.present', { add: `W${step}` }, { cause: 'ui' });
            else if (how === 'hang') { server.mode = 'hang'; server.fails = 1; void ui(); await sleep(1); }
            else await within(ui());
            if (how === 'reload') { await recover('pre-reload'); await openFromServer(h, server, id); }
            const before = J(head());
            const edited = await cardEdit(h);
            server.release();
            await sleep(450);
            await recover(`${log.at(-1)} (card edit)`);
            if (J(head()) !== before) fail('#7 card edit lost state', `edited=${edited} ${diff(before, J(head()))}`);
            // and from the file
            await openFromServer(h, server, id);
            if (J(head()) !== before) fail('#7 card edit: reopened file lost state', diff(before, J(head())));
            if (r.chance(0.5)) {          // back to a chat with history
                const prev = `chat-${seed}-${chatN - 1}`;
                if (server.files.has(prev)) await openFromServer(h, server, prev);
            }
        },
        async recover() { await recover('recover'); },
        async bigReply(step) { await within(h.send(`User ${step}.`, replyText(r, step, true))); },
    };
    const WEIGHTS = { send: 18, ui: 6, ui2: 4, sendFail: 6, uiDuringReplySave: 5, saveDuringTimeline: 5, swipe: 6, swipeTo: 5, swipeDelete: 3,
        swipeDeleteOld: 2, deleteLast: 4, deleteMiddle: 2, deleteCheckpoint: 2, regenerate: 3, cont: 3, reload: 4, rename: 3, newChatCard: 2, recover: 4, bigReply: 3 };
    if (process.env.PROFILE === 'cp') Object.assign(WEIGHTS, { send: 30, bigReply: 25, deleteCheckpoint: 4, swipeDeleteOld: 3, newChatCard: 0.3, deleteMiddle: 3 });
    const names = Object.keys(WEIGHTS).filter(n => !ONLY.length || ONLY.includes(n) || n === 'send');
    const total = names.reduce((s, n) => s + WEIGHTS[n], 0);
    for (let step = 0; step < STEPS; step++) {
        let x = r() * total, op = names[0];
        for (const n of names) { x -= WEIGHTS[n]; if (x < 0) { op = n; break; } }
        log.push(op);
        try { await OPS[op](step); } catch (e) { fail(`threw in ${op}`, e?.stack ?? e); server.release(); }
        check(`${step}:${log.at(-1)}`);
        if (STOP && violations.length) break;
    }
    await recover('end');
    h.close();
    console.warn = origWarn; console.error = origErr;
    restore();
    const cps = ctx.chat.filter(m => readRecord(m)?.checkpoint).length;
    return { violations, log, len: ctx.chat.length, cps, bytes: JSON.stringify(ctx.chat).length, writes: server.writes };
}

const all = [];
for (let seed = SEED_FROM; seed <= SEED_TO; seed++) {
    const out = await runSeed(seed);
    const kinds = {};
    for (const v of out.violations) { const k = v.what.replace(/\d+/g, 'N'); kinds[k] = (kinds[k] ?? 0) + 1; }
    console.log(`seed ${seed}: ${out.violations.length} viol, ${out.len} msgs, ${out.cps} cps, ${out.bytes} B, ${out.writes} writes`, JSON.stringify(kinds));
    for (const v of out.violations.slice(0, 3)) console.log('   ', JSON.stringify(v));
    if (process.env.LOG) console.log(out.log.map((o, i) => `${i}:${o}`).join(' '));
    all.push(...out.violations);
}
const byKind = {};
for (const v of all) { const k = `${v.what.replace(/\d+/g, 'N')} [${String(v.op).split(/[:@]/)[0]}]`; (byKind[k] ??= []).push(`${v.seed}@${v.step}:${v.op}`); }
console.log('\nSUMMARY');
for (const [k, list] of Object.entries(byKind)) console.log(`${list.length}\t${k}\t${list.slice(0, 6).join(' ')}`);
process.exit(0);
