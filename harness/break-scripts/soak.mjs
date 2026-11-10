// b6-soak: a long, messy play session in real SillyTavern 1.19 with all four extensions and the Ersveil
// pack, driven through the UI with Playwright. Writes metrics to <OUT>/run/.
// usage: node soak.mjs --replies 1500 --seed 6 [--fresh]
import fs from 'node:fs';
import crypto from 'node:crypto';
import { CHAR_NAME, MOCK_LOG, MOCK_Q, OUT, REPOS, ST_DATA, ST_URL, clearQueue, connectMock, launch, queue, readReq, reqNums, waitHost } from './lib.mjs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { createGen, rng } from './gen.mjs';
import { launchRaw } from './cdp-page.mjs';
const { sharedPrefix } = await import(`${REPOS}/Story_block/testkit/fake-st.js`);

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]] : null).filter(Boolean));
const TARGET = Number(args.replies ?? 1500);
const SEED = Number(args.seed ?? 6);
const RUN = `${OUT}/${args.out ?? 'run'}`;
fs.mkdirSync(`${RUN}/snap`, { recursive: true });
const STATIC_MARKER = '[Story Suite: how this story is kept]';
const NSD_STATIC = 'NPC STATE DELTA ONE-PASS CAPTURE.';
const NSD_TAIL = 'NPC STATE DELTA ONE-PASS CAPTURE — context';
const sha = text => crypto.createHash('sha1').update(String(text)).digest('hex').slice(0, 12);
const logLines = [];
const log = (...a) => { const line = `[${new Date().toISOString().slice(11, 19)}] ${a.join(' ')}`; logLines.push(line); console.log(line); fs.appendFileSync(`${RUN}/log.txt`, `${line}\n`); };

const gen = createGen(SEED);
const act = rng(SEED * 7919 + 1);
const chance = p => act() < p;

// Mock log starts clean so request numbers are this run's.
const RESUME = typeof args.resume === 'string' ? args.resume : null;
const SEG = args.segment ?? 'a';
if (!RESUME) for (const f of fs.readdirSync(MOCK_LOG)) fs.rmSync(`${MOCK_LOG}/${f}`, { recursive: true, force: true });
clearQueue();

let browser, page;
const consoleKinds = new Map();
let consoleErr = 0, consoleWarn = 0, pageErrors = 0;
const samples = [];
const norm = text => text.replace(/\d+/g, '#').replace(/\s+/g, ' ').slice(0, 170);
function attach() {
page.on('pageerror', e => { pageErrors += 1; const k = `pageerror ${norm(e.message)}`; consoleKinds.set(k, (consoleKinds.get(k) ?? 0) + 1); if (samples.length < 300) samples.push({ step, kind: 'pageerror', text: `${e.message}\n${e.stack ?? ''}`.slice(0, 1500) }); });
page.on('console', m => {
    const type = m.type();
    if (type !== 'error' && type !== 'warning') return;
    if (type === 'error') consoleErr += 1; else consoleWarn += 1;
    const k = `${type} ${norm(m.text())}`;
    const first = !consoleKinds.has(k);
    consoleKinds.set(k, (consoleKinds.get(k) ?? 0) + 1);
    if (first && samples.length < 300) samples.push({ step, kind: type, text: m.text().slice(0, 1500), loc: m.location()?.url });
});
}
let saves = 0, saveBytes = 0;
const failedRequests = [];
// Saves are counted in the page (a fetch wrapper): Playwright keeps request bodies alive, and a
// 15 MB chat saved 5 times a reply ran the driver out of memory.
const pageSaves = () => ev(() => [window.__soak?.saves ?? 0, window.__soak?.saveBytes ?? 0]).catch(() => [0, 0]);
async function openBrowser() {
    ({ browser, page } = await launchRaw({ port: Number(process.env.CDP_PORT ?? 9452) }));
    attach();
    page.on('response', res => { if (res.status() >= 400 && failedRequests.length < 200) failedRequests.push({ step, status: res.status(), url: res.url().slice(0, 200) }); });
}
await openBrowser();

const ev = (fn, a) => page.evaluate(fn, a);
let step = Number(args.step0 ?? 0);

async function instrument() {
    await ev(() => {
        if (window.__soak?.installed) return;
        const s = window.__soak = { installed: true, turns: [], intercept: [], recvAt: null, saves: 0, saveBytes: 0 };
        const realFetch = window.fetch;
        window.fetch = function (input, init) {
            try {
                const url = typeof input === 'string' ? input : input?.url ?? '';
                if (url.includes('/api/chats/save')) { s.saves += 1; s.saveBytes += typeof init?.body === 'string' ? init.body.length : 0; }
            } catch { /* counting only */ }
            return realFetch.apply(this, arguments);
        };
        const ctx = SillyTavern.getContext();
        ctx.eventSource.makeFirst(ctx.eventTypes.MESSAGE_RECEIVED, () => { s.recvAt = performance.now(); });
        StoryBlock.sdk.on('turn', t => s.turns.push({ at: performance.now(), recvAt: s.recvAt, index: t.index, type: t.type, receipts: t.receipts.length, problems: t.problems.map(p => `${p.module ?? 'host'}:${p.code}`) }));
        const orig = window.storyBlockGenerationInterceptor;
        window.storyBlockGenerationInterceptor = async (...a) => {
            const t0 = performance.now();
            try { return await orig(...a); } finally { s.intercept.push({ type: a[3], ms: performance.now() - t0 }); }
        };
    });
}

async function boot() {
    await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
    await waitHost(page);
    await instrument();
}

await boot();
await connectMock(page);
let chatId;
if (RESUME) {
    chatId = RESUME;
    await ev(async ({ chatId, CHAR_NAME }) => {
        const ctx = SillyTavern.getContext();
        await ctx.executeSlashCommandsWithOptions('/persona-set mode=temp Wessel');
        await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
        await new Promise(r => setTimeout(r, 1000));
        await ctx.openCharacterChat(chatId);
        await new Promise(r => setTimeout(r, 2000));
    }, { chatId, CHAR_NAME });
    log('resumed chat', chatId, 'now', await ev(() => SillyTavern.getContext().getCurrentChatId()), 'messages', await ev(() => SillyTavern.getContext().chat.length));
} else {
chatId = await ev(async CHAR_NAME => {
        const ctx = SillyTavern.getContext();
        ctx.powerUserSettings.personas['user-default.png'] = 'Wessel';
        await ctx.executeSlashCommandsWithOptions('/persona-set mode=temp Wessel');
        ctx.saveSettingsDebounced();
        await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
        await new Promise(r => setTimeout(r, 1500));
        await ctx.executeSlashCommandsWithOptions('/newchat');
        await new Promise(r => setTimeout(r, 2500));
        return SillyTavern.getContext().getCurrentChatId();
    }, CHAR_NAME);
    await page.keyboard.press('Escape');
    await ev(() => document.querySelector('.ss-dialog-close')?.click());
    const made = await ev(async () => {
        const p = StoryBlock.sdk.query('creation.content').presets[0];
        const r = await StoryBlock.sdk.command('creation.finish', { name: SillyTavern.getContext().name1, preset: p.id, race: p.race, talents: p.talents, points: p.points });
        return r.ok ? r.receipt.summary : `${r.code} ${r.message}`;
    });
    log('chat', chatId, 'persona', await ev(() => SillyTavern.getContext().name1), 'creation:', made);
}
const chatFile = `${ST_DATA}/default-user/chats/${CHAR_NAME}/${chatId}.jsonl`;

// ------------------------------------------------------------------------------------------------
const hint = () => ev(() => {
    const st = StoryBlock.sdk.view().state;
    const d = st?.domains ?? {};
    const inv = d.inventory ?? {};
    const carried = Object.values(inv.stacks ?? {}).map(s => inv.defs?.[s.def]?.name).filter(Boolean);
    const wallet = Object.values(inv.wallets ?? {}).reduce((sum, w) => sum + Object.values(w ?? {}).reduce((a, b) => a + (Number(b) || 0), 0), 0);
    const quests = Object.values(d.director?.threads ?? {}).filter(t => t?.kind === 'quest' && !t.ended).map(t => t.key ?? t.fields?.name).filter(Boolean);
    const party = d.party ?? {};
    const companions = Object.values(party.actors ?? {}).filter(a => a.id !== party.pc).map(a => a.name);
    return { present: d.scene?.present ?? [], place: d.scene?.place?.name, carried: [...new Set(carried)], wallet, quests, companions, rev: st?.meta?.rev ?? 0 };
});

const generating = () => ev(() => { const s = document.querySelector('#mes_stop'); return Boolean(s && getComputedStyle(s).display !== 'none'); });

async function waitTurn(before, ms = 90000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
        const [n, gen] = await ev(() => [window.__soak.turns.length, (() => { const s = document.querySelector('#mes_stop'); return Boolean(s && getComputedStyle(s).display !== 'none'); })()]);
        if (n > before && !gen) return true;
        // Held back before any request (canGenerate): the queued reply is still there and nothing runs.
        if (!gen && Date.now() - t0 > 6000 && fs.readdirSync(MOCK_Q).length > 0
            && await ev(() => document.querySelector('#story_suite_v2_bar .story-suite-notice')?.hidden === false && SillyTavern.getContext().chat.at(-1)?.is_user)) return false;
        await page.waitForTimeout(60);
    }
    return false;
}

let relaunches = 0;
process.on('unhandledRejection', error => log(`unhandled rejection in the driver: ${error?.message ?? error}`));
let replies = Number(args.replies0 ?? 0), stuck = 0, stuckReloads = 0, driverErrors = 0, heldBack = 0;
let prevReq = null;
let prevStatic = null, prevNsdStatic = null, prevSys = null;
const staticChanges = [];
const csv = fs.createWriteStream(`${RUN}/metrics.csv`, { flags: RESUME ? 'a' : 'w' });
const COLS = ['step', 'action', 'ok', 'replies', 'chat_len', 'req', 'latency_ms', 'total_ms', 'capture_ms', 'intercept_ms', 'static_sha', 'static_len', 'static_changed', 'nsd_static_sha', 'sys_prefix_sha', 'sb_tail_chars', 'sb_tail_tokens', 'nsd_tail_chars', 'shared_prefix_pct', 'prefix_chars', 'req_chars', 'chat_file_bytes', 'storysuite_bytes', 'head_bytes', 'rev', 'heap_used', 'heap_after_gc', 'dom_nodes', 'ss_cards', 'mes_nodes', 'saves', 'save_bytes', 'receipts', 'problems', 'console_err', 'console_warn', 'page_errors', 'stuck', 'extra_calls', 'reader_actions'];
if (!RESUME) csv.write(`${COLS.join(',')}\n`);
const problemCodes = new Map();
const readerLog = new Map();
const actionCounts = {};

function servedExtra() {
    try { return fs.readFileSync(`${MOCK_LOG}/served.txt`, 'utf8').split('\n').filter(l => l.includes('main=false')).length; } catch { return 0; }
}

async function trigger(kind) {
    const h = await hint();
    const out = gen.next(h);
    queue(out.reply);
    fs.appendFileSync(`${RUN}/replies.jsonl`, `${JSON.stringify({ step, kind, user: out.user, reply: out.reply, meta: out.meta })}\n`);
    const turnsBefore = await ev(() => window.__soak.turns.length);
    const reqBefore = reqNums().at(-1) ?? 0;
    const t0 = Date.now();
    if (kind === 'send') {
        await page.fill('#send_textarea', out.user);
        try { await page.click('#send_but', { timeout: 10000 }); } catch (e) { log(`send button not clickable at step ${step}: ${e.message.split('\n')[0]}`); }
    } else if (kind === 'swipe') {
        await ev(() => window.jQuery('#chat .mes.last_mes .swipe_right').trigger('click'));
    } else if (kind === 'regenerate') {
        await ev(() => window.jQuery('#option_regenerate').trigger('click'));
    }
    const ok = await waitTurn(turnsBefore);
    const total = Date.now() - t0;
    if (!ok) {
        stuck += 1;
        const leftover = fs.readdirSync(MOCK_Q).length;
        const state = await ev(() => ({ gen: (() => { const s = document.querySelector('#mes_stop'); return Boolean(s && getComputedStyle(s).display !== 'none'); })(), last: SillyTavern.getContext().chat.at(-1)?.mes?.slice(0, 120), len: SillyTavern.getContext().chat.length, toasts: [...document.querySelectorAll('#toast-container .toast')].map(t => t.textContent.slice(0, 200)) }));
        state.turns = await ev(() => window.__soak.turns.length); state.turnsBefore = turnsBefore;
        log(`STUCK step ${step} ${kind}: queue left=${leftover}`, JSON.stringify(state));
        await page.screenshot({ path: `${RUN}/snap/stuck-${step}.png` });
        if (!state.gen && (await ev(() => Boolean(SillyTavern.getContext().chat.at(-1)?.is_user)))) {
            // Held back (canGenerate), e.g. "You died. Return in time, or swipe/delete back.": the reader
            // deletes back past the reply that holds the fatal fight.
            const why = await ev(() => [...document.querySelectorAll('.story-suite-notice-text')].map(n => n.textContent).join(' | '));
            await ev(async () => {
                const c = SillyTavern.getContext();
                while (c.chat.length > 1 && c.chat.at(-1).is_user) await c.executeSlashCommandsWithOptions('/del 1');
                if (c.chat.length > 2) await c.executeSlashCommandsWithOptions('/del 1');
            });
            await page.waitForTimeout(800);
            heldBack += 1;
            log(`  held back at step ${step} (${why || 'no notice text'}); deleted back to message ${await ev(() => SillyTavern.getContext().chat.length)}`);
        }
        if (state.gen) {
            // Give it longer, then Stop, then reload: how long the reader would be locked out.
            const t1 = Date.now();
            let freed = false;
            while (Date.now() - t1 < 90000) { if (!(await generating())) { freed = true; break; } await page.waitForTimeout(500); }
            log(`  stuck step ${step}: ${freed ? `freed by itself after ${Date.now() - t1 + 30000} ms` : 'still generating after 120 s'}`);
            if (!freed) {
                await ev(() => window.jQuery('#mes_stop').trigger('click'));
                await page.waitForTimeout(2000);
                if (await generating()) { log(`  stuck step ${step}: Stop did not free it; reloading`); await reload(); stuckReloads += 1; }
                else log(`  stuck step ${step}: freed by Stop`);
            }
        }
        clearQueue();
    }
    const newReqs = reqNums().filter(n => n > reqBefore);
    let mainReq = null;
    for (const n of newReqs) { const body = readReq(n); if (JSON.stringify(body).includes(STATIC_MARKER)) mainReq = { n, body, at: fs.statSync(`${MOCK_LOG}/req-${n}.json`).mtimeMs }; }
    if (!mainReq && newReqs.length) { const n = newReqs.at(-1); mainReq = { n, body: readReq(n), at: fs.statSync(`${MOCK_LOG}/req-${n}.json`).mtimeMs, noStatic: true }; }
    if (ok) replies += 1;
    return { ok, total, mainReq, latency: mainReq ? Math.round(mainReq.at - t0) : '', out };
}

async function readerActions() {
    const did = [];
    const r = await ev(async ({ fight, accept, roll, trade, spend, beta }) => {
        const sdk = StoryBlock.sdk;
        const out = [];
        const cmd = async (t, p) => { try { const x = await sdk.command(t, p); out.push(`${t}:${x.ok ? 'ok' : x.code}`); return x; } catch (e) { out.push(`${t}:THROW ${e.message}`); return null; } };
        const q = (n, a) => { try { return sdk.query(n, a); } catch (e) { out.push(`q ${n}:THROW ${e.message.slice(0, 80)}`); return null; } };
        const offers = q('combat.offers') ?? [];
        // A reader does not walk into a fight to the death; those offers are turned down.
        for (const o of offers.filter(o => o.stakes === 'death').slice(0, 2)) await cmd('combat.dismiss', { offer: o.id });
        const fair = offers.filter(o => o.stakes !== 'death');
        if (fight && fair.length) {
            const start = await cmd('combat.start', { offer: fair[0].id });
            if (start?.ok) {
                for (let i = 0; i < 80; i += 1) {
                    const s = q('combat.session');
                    if (!s || s.status !== 'active') break;
                    const a = await cmd('combat.act', { action: { type: 'auto' } });
                    if (!a?.ok) break;
                }
                await cmd('combat.end', {});
            }
        } else if (fair.length > 2) await cmd('combat.dismiss', { offer: fair[0].id });
        const po = q('party.offers') ?? [];
        for (const o of po.slice(0, 2)) await cmd(accept ? 'party.acceptOffer' : 'party.dismissOffer', { offer: o.id });
        if (roll) for (const c of (q('checks.pending') ?? []).slice(0, 1)) await cmd('check.roll', { id: c.id });
        if (spend) { const pc = q('party.pc'); if (pc?.points > 0) await cmd('party.spend', { actor: pc.id, points: { DEX: 1 } }); }
        // Beta reader actions (beta-e2e): each only when some module registers the command.
        const has = t => sdk.modules().some(m => m.commands.includes(t));
        if (beta && has('inventory.lootTake')) {
            const rec = SillyTavern.getContext().chat.at(-1)?.extra?.storySuite?.receipts ?? [];
            const loot = rec.find(x => /loot/.test(x.type) && !x.data?.refused);
            const names = Array.isArray(loot?.data?.items) ? loot.data.items.map(i => i.name).filter(Boolean) : [];
            if (loot) await cmd('inventory.lootTake', { loot: loot.data?.loot ?? loot.data?.offer ?? loot.data?.id, offer: loot.data?.offer ?? loot.data?.id, names: names.slice(0, 2), take: names.slice(0, 2).map(name => ({ name, qty: 1 })) });
        }
        if (beta && has('inventory.repair') && Math.random() < 0.3) {
            const inv = sdk.view().state.domains.inventory;
            const worn = Object.values(inv.stacks ?? {}).find(s => s.equipped && Number(s.cond ?? s.condition ?? 100) < 100);
            if (worn) await cmd('inventory.repair', { stack: worn.id });
        }
        if (beta && has('inventory.equipOn') && Math.random() < 0.15) {
            const party = sdk.view().state.domains.party ?? {};
            const comp = Object.values(party.actors ?? {}).find(a => a.id !== party.pc);
            const inv = sdk.view().state.domains.inventory;
            const piece = Object.values(inv.stacks ?? {}).find(s => !s.equipped && inv.defs?.[s.def]?.slot);
            if (comp && piece) await cmd('inventory.equipOn', { stack: piece.id, actor: comp.id });
        }
        if (beta && has('craft.make') && Math.random() < 0.1) {
            const view = q('craft.view');
            const recipe = (view?.recipes ?? view?.known ?? [])[0];
            if (recipe) await cmd('craft.make', { recipe: recipe.id ?? recipe.name });
        }
        if (trade) {
            const stock = q('trade.stock', { kind: 'general' });
            const line = Array.isArray(stock?.lines) ? stock.lines[0] : Array.isArray(stock) ? stock[0] : null;
            if (line) await cmd('trade.buy', { shop: stock.shop ?? stock.key ?? 'general', def: line.def ?? line.id, qty: 1 });
            const inv = sdk.view().state.domains.inventory;
            const stack = Object.values(inv.stacks ?? {}).find(s => !s.equipped && String(s.def).startsWith('story/'));
            if (stack) await cmd('trade.sell', { stack: stack.id, qty: 1 });
        }
        return out;
    }, { fight: chance(0.7), accept: chance(0.5), roll: chance(0.3), trade: chance(0.06), spend: chance(0.2), beta: chance(0.8) });
    for (const x of r) { did.push(x); readerLog.set(x, (readerLog.get(x) ?? 0) + 1); }
    return did;
}

async function uiTour(kind) {
    try {
        if (kind === 'tabs') {
            await ev(() => document.querySelector('.story-suite-bar-story')?.click());
            await page.waitForTimeout(250);
            const n = await ev(() => document.querySelectorAll('#story_suite_v2_panel .story-suite-tab').length);
            for (let i = 0; i < n; i += 1) { await ev(i => document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')[i]?.click(), i); await page.waitForTimeout(120); }
            await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
        } else if (kind === 'game') {
            await page.keyboard.press('Alt+KeyG');
            await page.waitForTimeout(300);
            const n = await ev(() => document.querySelectorAll('.ss-gameview-navitem').length);
            for (let i = 0; i < n; i += 1) { await ev(i => document.querySelectorAll('.ss-gameview-navitem')[i]?.click(), i); await page.waitForTimeout(150); }
            await ev(() => document.querySelector('.ss-gameview-close')?.click());
            await page.waitForTimeout(100);
            if (await ev(() => Boolean(document.querySelector('.ss-gameview:not([hidden])')))) await page.keyboard.press('Alt+KeyG');
        } else if (kind === 'cards') {
            await ev(() => { for (const h of [...document.querySelectorAll('#chat .mes .ss-card-head')].slice(-4)) h.click(); });
            await page.waitForTimeout(200);
            await ev(() => { for (const h of [...document.querySelectorAll('#chat .mes .ss-card-open .ss-card-head')]) h.click(); });
        }
        return `${kind}:ok`;
    } catch (e) { return `${kind}:ERR ${e.message.slice(0, 100)}`; }
}

async function edit() {
    const variant = Math.floor(act() * 3);
    return ev(async variant => {
        const $ = window.jQuery;
        const last = $('#chat .mes.last_mes');
        if (last.attr('is_user') === 'true') return 'edit:skip-user';
        last.find('.mes_edit').trigger('click');
        await new Promise(r => setTimeout(r, 300));
        const ta = $('#curEditTextarea');
        if (!ta.length) return 'edit:no-textarea';
        let text = String(ta.val());
        if (variant === 0) text += '\n\nA gull lands on the rail and stares.';
        else if (variant === 1) text = text.replace(/<!--\s*STORY_SUITE_V2[\s\S]*?-->/, '').trim();
        else text = text.replace(/\+ coin \d+/, '+ coin 9000').replace(/qty: \d+/, 'qty: 50') + '\n<Changes>\n+ coin 777 | from: an edit\n</Changes>';
        ta.val(text).trigger('input');
        $('#chat .mes.last_mes .mes_edit_done').trigger('click');
        await new Promise(r => setTimeout(r, 500));
        return `edit:v${variant}`;
    }, variant);
}

async function del() {
    const n = await ev(() => SillyTavern.getContext().chat.length);
    if (n < 6) return 'del:skip';
    const count = chance(0.5) ? 2 : 1;
    await ev(async c => { await SillyTavern.getContext().executeSlashCommandsWithOptions(`/del ${c}`); }, count);
    await page.waitForTimeout(500);
    return `del:${count}`;
}

async function snapshot(tag) {
    await page.waitForTimeout(900);
    await ev(async () => { const c = SillyTavern.getContext(); await c.saveChat(); });
    await page.waitForTimeout(600);
    const head = await ev(() => JSON.stringify(StoryBlock.sdk.view().state));
    const len = await ev(() => SillyTavern.getContext().chat.length);
    fs.writeFileSync(`${RUN}/snap/${tag}-head.json`, head);
    fs.copyFileSync(chatFile, `${RUN}/snap/${tag}-chat.jsonl`);
    log(`snapshot ${tag}: head ${head.length} B sha ${sha(head)} chat_len ${len} file ${fs.statSync(chatFile).size} B`);
    // Invariant 1 at every snapshot: rebuild from the saved file == the live head (rebuild.mjs, own process).
    try {
        const outJson = `${RUN}/rebuild-${tag}.json`;
        execFileSync(process.execPath, ['--max-old-space-size=2000', new URL('./rebuild.mjs', import.meta.url).pathname, `${RUN}/snap/${tag}-chat.jsonl`, `${RUN}/snap/${tag}-head.json`, '--json', outJson], { stdio: 'ignore', timeout: 300000, env: { ...process.env, REPOS } });
        const rb = JSON.parse(fs.readFileSync(outJson, 'utf8'));
        log(`rebuild ${tag}: head==live ${rb.headEqualsLive} fullReplay==live ${rb.fullReplayEqualsLive} replayErrors ${rb.replayErrorCount} checkpointMismatch ${rb.checkpointMismatchCount} swipeInfoMismatch ${rb.swipeInfoMismatchCount} rebuild ${rb.rebuildMs} ms${rb.headEqualsLive ? '' : ` DIFF ${JSON.stringify(rb.headDiff).slice(0, 300)}`}`);
    } catch (error) { log(`rebuild ${tag}: could not run (${error.message.split('\n')[0]})`); }
}

// Never let the box OOM-kill the soak: below MIN_AVAIL_GB available, pause (poll every 30 s) until it is back.
const MIN_AVAIL_GB = Number(process.env.MIN_AVAIL_GB ?? 3);
function availGB() { try { const m = /MemAvailable:\s+(\d+) kB/.exec(fs.readFileSync('/proc/meminfo', 'utf8')); return m ? Number(m[1]) / 1048576 : os.freemem() / 1073741824; } catch { return os.freemem() / 1073741824; } }
async function memoryGuard() {
    let paused = 0;
    while (availGB() < MIN_AVAIL_GB) {
        if (!paused) log(`PAUSE: available memory ${availGB().toFixed(2)} GB < ${MIN_AVAIL_GB} GB`);
        paused += 1;
        await new Promise(r => setTimeout(r, 30000));
    }
    if (paused) log(`RESUME after ${paused * 30} s: available ${availGB().toFixed(2)} GB`);
}

async function reload() {
    try { await page.reload({ waitUntil: 'domcontentloaded' }); } catch (error) {
        log(`reload failed (${error.message}); relaunching the browser`);
        try { await browser.close(); } catch { /* gone */ }
        await openBrowser();
        relaunches += 1;
        await page.goto(ST_URL);
    }
    await waitHost(page);
    await instrument();
    await connectMock(page);
    const id = await ev(() => SillyTavern.getContext().getCurrentChatId());
    if (id !== chatId) {
        log(`reload: chat after reload was ${id}; reopening ${chatId}`);
        await ev(async ({ chatId, CHAR_NAME }) => {
            const ctx = SillyTavern.getContext();
            await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
            await new Promise(r => setTimeout(r, 1000));
            await ctx.openCharacterChat(chatId);
            await new Promise(r => setTimeout(r, 1500));
        }, { chatId, CHAR_NAME });
    }
    await page.waitForTimeout(800);
}

// ------------------------------------------------------------------------------------------------
const tStart = Date.now();
let lastReload = replies;
let readerActs = [];
async function oneStep() {
    step += 1;
    const roll = act();
    const chatLen = await ev(() => SillyTavern.getContext().chat.length);
    const lastIsAi = await ev(() => { const m = SillyTavern.getContext().chat.at(-1); return Boolean(m && !m.is_user); });
    let action = 'send';
    if (roll < 0.10 && chatLen > 2 && lastIsAi) action = 'swipe';
    else if (roll < 0.13) action = 'delete';
    else if (roll < 0.15 && chatLen > 2) action = 'edit';
    else if (roll < 0.20 && chatLen > 2 && lastIsAi) action = 'regenerate';
    actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    const [savesBefore, bytesBefore] = await pageSaves();
    const errBefore = consoleErr, warnBefore = consoleWarn, pageErrBefore = pageErrors;
    const turnsIndex = await ev(() => window.__soak.turns.length);
    const interceptIndex = await ev(() => window.__soak.intercept.length);
    let res = { ok: true, total: '', mainReq: null, latency: '' };
    let note = '';
    try {
        if (action === 'send' || action === 'swipe' || action === 'regenerate') res = await trigger(action);
        else if (action === 'delete') note = await del();
        else if (action === 'edit') note = await edit();
    } catch (e) {
        log(`step ${step} ${action} threw in the driver: ${e.message.split('\n')[0]}`);
        res = { ok: false, total: '', mainReq: null, latency: '' };
        driverErrors += 1;
        if (await generating().catch(() => true)) { await reload(); stuckReloads += 1; }
    }

    // The reader plays between replies.
    if (action === 'send' && res.ok) readerActs = await readerActions();
    else readerActs = [];
    if (step % 25 === 0) readerActs.push(await uiTour('tabs'));
    if (step % 40 === 0) readerActs.push(await uiTour('game'));
    if (step % 15 === 0) readerActs.push(await uiTour('cards'));
    await page.waitForTimeout(450); // lets the 400 ms UI save land in this step

    const m = await ev(({ turnsIndex, interceptIndex, heavy, gc }) => {
        const s = window.__soak;
        const turns = s.turns.slice(turnsIndex);
        const t = turns.at(-1);
        const chat = SillyTavern.getContext().chat;
        let ssBytes = '';
        if (heavy) {
            ssBytes = 0;
            for (const msg of chat) {
                if (msg.extra?.storySuite) ssBytes += JSON.stringify(msg.extra.storySuite).length;
                for (const si of msg.swipe_info ?? []) if (si?.extra?.storySuite) ssBytes += JSON.stringify(si.extra.storySuite).length;
            }
        }
        let afterGc = '';
        if (gc && typeof window.gc === 'function') { window.gc(); afterGc = performance.memory?.usedJSHeapSize ?? ''; }
        const head = StoryBlock.sdk.view().state;
        return {
            capture: t && t.recvAt ? Math.round((t.at - t.recvAt) * 10) / 10 : '',
            intercept: s.intercept.slice(interceptIndex).map(x => Math.round(x.ms * 10) / 10).join('|'),
            receipts: turns.reduce((a, x) => a + x.receipts, 0),
            problems: turns.flatMap(x => x.problems),
            chatLen: chat.length,
            ssBytes,
            headBytes: JSON.stringify(head).length,
            rev: head?.meta?.rev ?? '',
            heap: performance.memory?.usedJSHeapSize ?? '',
            afterGc,
            dom: document.getElementsByTagName('*').length,
            cards: document.querySelectorAll('.ss-card').length,
            mes: document.querySelectorAll('#chat .mes').length,
            pwned: window.__pwned ?? null,
            blank: !document.querySelector('#chat') || document.querySelectorAll('#chat .mes').length === 0,
        };
    }, { turnsIndex, interceptIndex, heavy: step % 50 === 0, gc: step % 25 === 0 });
    for (const p of m.problems) problemCodes.set(p, (problemCodes.get(p) ?? 0) + 1);
    if (m.pwned) log(`!!! window.__pwned = ${m.pwned} at step ${step}`);
    if (m.blank) log(`!!! blank chat at step ${step}`);

    let reqCols = { req: '', static_sha: '', static_len: '', static_changed: '', nsd_static_sha: '', sys_prefix_sha: '', sb_tail_chars: '', sb_tail_tokens: '', nsd_tail_chars: '', shared_prefix_pct: '', prefix_chars: '', req_chars: '' };
    if (res.mainReq) {
        const msgs = res.mainReq.body.messages ?? [];
        const text = x => (typeof x.content === 'string' ? x.content : JSON.stringify(x.content));
        const st = msgs.map(text).find(t => t.startsWith(STATIC_MARKER)) ?? '';
        const nsdSt = msgs.map(text).find(t => t.startsWith(NSD_STATIC)) ?? '';
        const firstChat = msgs.findIndex(x => x.role !== 'system');
        const sysPrefix = msgs.slice(0, firstChat < 0 ? msgs.length : firstChat).map(text).join('\n\u0001\n');
        const lastUser = msgs.findLastIndex(x => x.role === 'user');
        const tailMsg = msgs.slice(lastUser + 1).filter(x => x.role === 'system').map(text).join('\n');
        const nsdAt = tailMsg.indexOf(NSD_TAIL);
        const sbTail = nsdAt >= 0 ? tailMsg.slice(0, nsdAt) : tailMsg;
        const nsdTail = nsdAt >= 0 ? tailMsg.slice(nsdAt) : '';
        const staticSha = sha(st);
        const changed = prevStatic !== null && staticSha !== prevStatic;
        if (changed) {
            staticChanges.push({ step, req: res.mainReq.n, action, from: prevStatic, to: staticSha });
            fs.writeFileSync(`${RUN}/snap/static-${res.mainReq.n}.txt`, st);
        }
        if (prevNsdStatic !== null && sha(nsdSt) !== prevNsdStatic) staticChanges.push({ step, req: res.mainReq.n, action, part: 'nsd', from: prevNsdStatic, to: sha(nsdSt) });
        if (prevSys !== null && sha(sysPrefix) !== prevSys) staticChanges.push({ step, req: res.mainReq.n, action, part: 'system-prefix', from: prevSys, to: sha(sysPrefix) });
        if (prevStatic === null) fs.writeFileSync(`${RUN}/snap/static-first.txt`, st);
        prevStatic = staticSha; prevNsdStatic = sha(nsdSt); prevSys = sha(sysPrefix);
        const sp = prevReq ? sharedPrefix(prevReq.messages, msgs) : { percent: '', chars: '' };
        prevReq = res.mainReq.body;
        reqCols = {
            req: res.mainReq.n, static_sha: staticSha, static_len: st.length, static_changed: changed ? 1 : 0, nsd_static_sha: sha(nsdSt), sys_prefix_sha: sha(sysPrefix),
            sb_tail_chars: sbTail.length, sb_tail_tokens: Math.ceil(sbTail.length / 4), nsd_tail_chars: nsdTail.length,
            shared_prefix_pct: sp.percent, prefix_chars: sp.chars, req_chars: JSON.stringify(msgs).length,
        };
        if (res.mainReq.noStatic) log(`!!! request ${res.mainReq.n} at step ${step} has no static part`);
        if (step % 100 === 1) fs.writeFileSync(`${RUN}/snap/tail-${step}.txt`, tailMsg);
    }
    const [savesNow, bytesNow] = await pageSaves();
    let fileBytes = '';
    try { fileBytes = fs.statSync(chatFile).size; } catch { fileBytes = ''; }
    const row = {
        step, action, ok: res.ok ? 1 : 0, replies, chat_len: m.chatLen, ...reqCols, latency_ms: res.latency, total_ms: res.total, capture_ms: m.capture, intercept_ms: m.intercept,
        chat_file_bytes: fileBytes, storysuite_bytes: m.ssBytes, head_bytes: m.headBytes, rev: m.rev, heap_used: m.heap, heap_after_gc: m.afterGc, dom_nodes: m.dom, ss_cards: m.cards, mes_nodes: m.mes,
        saves: savesNow - savesBefore, save_bytes: bytesNow - bytesBefore, receipts: m.receipts, problems: m.problems.length, console_err: consoleErr - errBefore, console_warn: consoleWarn - warnBefore,
        page_errors: pageErrors - pageErrBefore, stuck, extra_calls: servedExtra(), reader_actions: [note, ...readerActs].filter(Boolean).join(' ').replace(/,/g, ';'),
    };
    csv.write(`${COLS.map(c => String(row[c] ?? '').replace(/[\n,]/g, ' ')).join(',')}\n`);
    if (step % 25 === 0) log(`step ${step} replies ${replies} chat ${m.chatLen} file ${fileBytes} heap ${m.heap} dom ${m.dom} err ${consoleErr} warn ${consoleWarn} pageerr ${pageErrors} stuck ${stuck} static changes ${staticChanges.length} elapsed ${Math.round((Date.now() - tStart) / 1000)}s`);
    if (replies - lastReload >= 200) { lastReload = replies; log(`reload at reply ${replies}`); await snapshot(`r${replies}-before-reload`); await reload(); await snapshot(`r${replies}-after-reload`); }
    else if (replies - lastRebuildAt >= 100) { lastRebuildAt = replies; await snapshot(`n${replies}`); }
    if (Math.floor(replies / 250) > Math.floor(lastProgress / 250)) { lastProgress = replies; const line = `soak progress: ${replies} replies, step ${step}, file ${(fileBytes / 1e6).toFixed(1)} MB, heap ${(m.heap / 1e6).toFixed(0)} MB, stuck ${stuck}, page errors ${pageErrors}, static changes ${staticChanges.length}, avail ${availGB().toFixed(1)} GB`; log(line); fs.appendFileSync(`${RUN}/progress.txt`, `${line}\n`); }
    if (step % 500 === 0) await page.screenshot({ path: `${RUN}/snap/screen-${step}.png` });
    fs.writeFileSync(`${RUN}/summary-${SEG}.json`, JSON.stringify({ step, replies, stuck, stuckReloads, driverErrors, heldBack, relaunches, actionCounts, consoleErr, consoleWarn, pageErrors, staticChanges, problemCodes: Object.fromEntries([...problemCodes].sort((a, b) => b[1] - a[1])), readerLog: Object.fromEntries(readerLog), consoleKinds: Object.fromEntries([...consoleKinds].sort((a, b) => b[1] - a[1])), gen: gen.stats, failedRequests: failedRequests.slice(0, 100), elapsedSec: Math.round((Date.now() - tStart) / 1000), chatId, chatFile }, null, 1));
    fs.writeFileSync(`${RUN}/console-samples-${SEG}.json`, JSON.stringify(samples, null, 1));
}
let lastRebuildAt = replies;
let lastProgress = replies;
while (replies < TARGET) {
    await memoryGuard();
    try { await oneStep(); } catch (e) {
        driverErrors += 1;
        log(`step ${step} driver error: ${e.message.split('\n')[0]}`);
        if (driverErrors > 60 || /browser has been closed/.test(e.message)) break;
        try { await reload(); } catch (e2) { log(`reload failed: ${e2.message.split('\n')[0]}`); }
    }
}
csv.end();
await snapshot('final');
await page.screenshot({ path: `${RUN}/snap/screen-final.png` });
log('done', JSON.stringify({ replies, steps: step, stuck, consoleErr, consoleWarn, pageErrors, staticChanges: staticChanges.length }));
await browser.close();
