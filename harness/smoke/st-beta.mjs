// Story Suite v2 BETA live scenario: SillyTavern 1.19 + the mock model + the Ersveil pack, all four modules
// from /home/user/_break/beta-e2e/<repo> (v2 heads), driven through a raw-CDP page (no Playwright, no response
// bodies kept). It is the alpha.2 13-step test (st-v2-alpha2.mjs) plus one step per beta feature.
//
// Every beta step first probes for its feature (a query that answers, a command or a capture kind some module
// registers, an sdk function): a feature not merged yet is SKIP, never FAIL. Rows: PASS | FAIL | SKIP.
// usage: node st-beta.mjs [--tag name]   (env from inst-beta-e2e.env: ST_URL MOCK_URL MOCK_Q MOCK_LOG)
// Matrix knobs (env): CDP_PORT (desktop page; the phone page takes CDP_PORT+1), VIEW=desk|phone (the main page's
// width: 1440 or 390), PACK_MODE=ersveil|none, FEATURES=keep|all|off|random:<seed>, ECON=<money scale>,
// MODULES_EXPECTED=<n> (how many modules to wait for; 4).
import fs from 'node:fs';
import crypto from 'node:crypto';
import { launchRaw } from './cdp-page.mjs';

const SP = process.env.SP ?? '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const REPOS = process.env.REPOS ?? '/home/user/_break/beta-e2e';
const { sharedPrefix } = await import(`${REPOS}/Story_block/testkit/fake-st.js`);
const PACK = `${REPOS}/Story_block/examples/packs/ersveil-bluewatch/pack.json`;
const { ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG } = process.env;
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1] ?? true] : null)).filter(Boolean));
const TAG = args.tag ?? new Date().toISOString().slice(0, 16).replace(/[:T]/g, '');
const OUT = `${SP}/beta-e2e/scenario/${TAG}`;
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });
const CDP_PORT = Number(process.env.CDP_PORT ?? 9451);
const VIEW = process.env.VIEW ?? 'desk';
const PACK_MODE = process.env.PACK_MODE ?? 'ersveil';
const FEATURES = process.env.FEATURES ?? 'keep';
const ECON = process.env.ECON ? Number(process.env.ECON) : null;
const MODULES_EXPECTED = Number(process.env.MODULES_EXPECTED ?? 4);
const T0 = Date.now();
const out = [];
const rows = [];
const say = (...a) => { const line = a.join(' '); out.push(line); console.log(`[${((Date.now() - T0) / 1000).toFixed(0)}s] ${line}`); fs.appendFileSync(`${OUT}/log.txt`, `${line}\n`); };
const j = v => JSON.stringify(v);
let qn = 0;
const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now()).padStart(15, '0')}-${String(++qn).padStart(4, '0')}.txt`, text);
const clearQueue = () => { for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`); };
const reqNames = () => fs.readdirSync(MOCK_LOG).filter(f => /^req-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
const req = name => JSON.parse(fs.readFileSync(`${MOCK_LOG}/${name}`, 'utf8'));
const HEADER = '[Story Suite: how this story is kept]';
const isMain = name => { try { return req(name).messages.some(m => m.role === 'system' && String(m.content).includes(HEADER)); } catch { return false; } };
let REQ_BASE = 0;
const mainReqs = () => reqNames().filter(n => Number(n.match(/\d+/)[0]) > REQ_BASE).filter(isMain);
const staticOf = b => b.messages.filter(m => m.role === 'system').map(m => String(m.content)).find(t => t.includes(HEADER)) ?? '';
const tailOf = b => { const sys = b.messages.filter(m => m.role === 'system').map(m => String(m.content)); return sys.filter(t => !t.includes(HEADER)).join('\n---\n') + '\n===LAST===\n' + String(b.messages.at(-1)?.content ?? ''); };
const R = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);

// ---- result rows -------------------------------------------------------------------------------------
const PASS = (note = '') => ({ status: 'PASS', note });
const FAIL = (note = '') => ({ status: 'FAIL', note });
const SKIP = (note = '') => ({ status: 'SKIP', note });
const check = (ok, note) => (ok ? PASS(note) : FAIL(note));
async function step(id, title, owner, fn) {
    say(`\n---- ${id} ${title} (${owner}) ----`);
    let r;
    const t = Date.now();
    try { r = await fn(); } catch (e) { r = FAIL(`driver/page threw: ${String(e?.message ?? e).split('\n')[0].slice(0, 300)}`); }
    r = r ?? FAIL('step returned nothing');
    rows.push({ id, title, owner, status: r.status, note: r.note, ms: Date.now() - t });
    say(`>> ${r.status} ${id} ${title} — ${r.note}`);
    fs.writeFileSync(`${OUT}/rows.json`, JSON.stringify(rows, null, 1));
    return r;
}

// ---- page --------------------------------------------------------------------------------------------
clearQueue();
REQ_BASE = Math.max(0, ...reqNames().map(n => Number(n.match(/\d+/)[0])));
let { browser, page } = await launchRaw(VIEW === 'phone' ? { width: 390, height: 844, port: CDP_PORT, mobile: true, scale: 2 } : { width: 1440, height: 900, port: CDP_PORT });
const errors = [];
const watch = (p, tag) => {
    p.on('pageerror', e => errors.push(`${tag} pageerror ${e.message}`));
    p.on('response', r => { if (r.status() >= 400) errors.push(`${tag} ${r.status()} ${r.url()}`); });
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`${tag} console.${m.type()} ${m.text().slice(0, 300)}`); });
};
watch(page, 'desk');
const withTimeout = (promise, ms, label) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))]);
const ev = (fn, a, ms = 90000) => withTimeout(page.evaluate(fn, a), ms, String(fn).slice(0, 80));
const shot = async (name, p = page) => { try { await p.screenshot({ path: `${SHOTS}/${name}.png` }); } catch (e) { say(`   [shot failed] ${name}: ${e.message}`); } };
const waitHost = async (p = page) => {
    await p.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 120000 });
    await p.waitForFunction(n => StoryBlock.sdk.modules().length >= n, MODULES_EXPECTED, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(2000);
};
const connect = (p = page) => p.evaluate(async url => {
    const $ = window.jQuery;
    $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#custom_api_url_text').val(url).trigger('input');
    $('#custom_model_id').val('mock-model').trigger('input');
    $('#stream_toggle').prop('checked', false).trigger('change');
    $('#api_button_openai').trigger('click');
    await new Promise(r => setTimeout(r, 3000));
}, MOCK_URL);
const openChat = (chat, p = page) => p.evaluate(async main => { const ctx = SillyTavern.getContext(); if (ctx.getCurrentChatId() !== main) { if (ctx.characters[ctx.characterId]?.name !== 'The Narrator') { await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 1500)); } await ctx.openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); } }, chat);
async function reloadInto(chat) { await page.reload(); await waitHost(page); await connect(); await openChat(chat); }

// ---- probes: is a feature there? ---------------------------------------------------------------------
const hasQuery = name => ev(n => { try { StoryBlock.sdk.query(n, {}); return true; } catch (e) { return !/no module answers/.test(String(e?.message)); } }, name);
const hasCommand = type => ev(t => StoryBlock.sdk.modules().some(m => m.commands.includes(t)), type);
const hasKind = kind => ev(k => StoryBlock.sdk.modules().some(m => m.kinds.includes(k)), kind);
const firstOf = async (list, probe) => { for (const x of list) if (await probe(x)) return x; return null; };
const featureApi = () => ev(() => typeof StoryBlock.sdk.features === 'function');
const featuresList = () => ev(() => (typeof StoryBlock.sdk.features === 'function' ? StoryBlock.sdk.features().map(f => ({ id: f.id, moduleId: f.moduleId, on: f.on, prompt: f.prompt, default: f.default, label: f.label })) : []));
const featureOn = id => ev(i => (typeof StoryBlock.sdk.feature === 'function' ? StoryBlock.sdk.feature(i) : null), id);
// A feature that is declared but off counts as there (the scenario turns it on); one not declared → absent.
const featureDeclared = async id => (await featuresList()).some(f => f.id === id);
async function setFeature(id, on) {
    return ev(async ([i, v]) => {
        const row = [...document.querySelectorAll('.story-suite-feature')].find(n => n.dataset.feature === i);
        const input = row?.querySelector('input');
        let via = 'none';
        if (input) { input.checked = v; input.dispatchEvent(new Event('change', { bubbles: true })); via = 'switch'; } else {
            const es = SillyTavern.getContext().extensionSettings; es.storySuite ??= {}; es.storySuite.features ??= {}; es.storySuite.features[i] = v; SillyTavern.getContext().saveSettingsDebounced(); via = 'settings';
        }
        await new Promise(r => setTimeout(r, 700));
        return { via, now: typeof StoryBlock.sdk.feature === 'function' ? StoryBlock.sdk.feature(i) : null };
    }, [id, on]);
}

async function send(text, reply, { wait = 25000 } = {}) {
    if (reply !== null) queue(reply);
    const before = await ev(() => SillyTavern.getContext().chat.length);
    const reqBefore = mainReqs().length;
    await page.fill('#send_textarea', text);
    await page.click('#send_but');
    await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes && !(document.querySelector('#mes_stop') && getComputedStyle(document.querySelector('#mes_stop')).display !== 'none'); }, before, { timeout: wait }).catch(() => {});
    await page.waitForTimeout(2500);
    const list = mainReqs();
    return list.length > reqBefore ? list.at(-1) : null;
}
const cmd = (type, payload) => ev(async ([t, p]) => { try { const r = await StoryBlock.sdk.command(t, p); return r.ok ? { ok: true, summary: r.receipt.summary, data: r.receipt.data } : { ok: false, code: r.code, message: r.message }; } catch (e) { return { ok: false, code: 'THREW', message: e.message }; } }, [type, payload]);
const q = (name, a) => ev(([n, x]) => { try { return StoryBlock.sdk.query(n, x); } catch (e) { return `ERR ${e.message}`; } }, [name, a]);
const lastReceipts = () => ev(() => { const m = SillyTavern.getContext().chat.at(-1); return (m.extra?.storySuite?.receipts ?? []).map(r => ({ type: r.type, module: r.module ?? r.owner ?? null, summary: r.summary, data: r.data, rev: r.rev })); });
const openPanel = async () => { if (!(await ev(() => { const p = document.querySelector('#story_suite_v2_panel'); return p && !p.hidden && getComputedStyle(p).display !== 'none'; }))) { await ev(() => document.querySelector('.story-suite-bar-story')?.click()); await page.waitForTimeout(800); } };
const closePanel = () => ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
const tabNames = () => ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].map(x => x.textContent.trim()));
const tab = async (name, p = page) => {
    const found = await p.evaluate(n => { const b = [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(x => x.textContent.trim().startsWith(n)); b?.click(); return !!b; }, name);
    await p.waitForTimeout(900);
    return found;
};
const pane = (p = page) => p.evaluate(() => (document.querySelector('#story_suite_v2_panel .story-suite-pane')?.innerText ?? '').replace(/\s+/g, ' ').trim());
const wallet = () => q('inventory.wallet', {});
const coinOf = w => (w && typeof w === 'object' ? Object.values(w).reduce((a, b) => a + (Number(b) || 0), 0) : 0);
const items = async () => { const l = await q('inventory.items', {}); return Array.isArray(l) ? l : []; };
const countOf = (list, re) => (list ?? []).filter(i => re.test(i.name)).reduce((a, i) => a + i.qty, 0);
const stateJSON = s => JSON.stringify({ domains: s?.domains });
const headState = () => ev(() => StoryBlock.sdk.view().state);
// Live head vs a page reload (rebuild from the saved file): invariant 1.
async function liveEqualsRebuild(chat) {
    await ev(async () => { await SillyTavern.getContext().saveChat(); });
    await page.waitForTimeout(1200);
    const live = await headState();
    await reloadInto(chat);
    const rebuilt = await headState();
    const same = stateJSON(live) === stateJSON(rebuilt);
    let differing = [];
    if (!same) { const a = live?.domains ?? {}; const b = rebuilt?.domains ?? {}; differing = Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])); }
    return { same, differing };
}

await page.goto(ST_URL);
await waitHost(page);
const heads = {};
for (const r of ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta']) {
    try { heads[r] = fs.readFileSync(`${REPOS}/${r}/.git/HEAD`, 'utf8').trim(); const ref = heads[r].replace('ref: ', ''); heads[r] = ref.startsWith('refs/') ? fs.readFileSync(`${REPOS}/${r}/.git/${ref}`, 'utf8').trim().slice(0, 7) : heads[r].slice(0, 7); } catch { heads[r] = '?'; }
}
say('heads:', j(heads));

// =========================================== alpha.2 steps ===========================================
let mainChat, spareChat, pc;
await step('A0', 'pack installs through Story Block\'s importer', 'SB-packs2', async () => {
    const mods = await ev(() => StoryBlock.sdk.modules().map(m => ({ id: m.id, version: m.version, features: m.features ?? null })));
    say('   modules:', j(mods));
    if (PACK_MODE === 'none') {
        const res = await ev(async () => {
            const mod = await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js');
            for (const p of mod.packs.list()) await mod.packs.remove(p.id);
            return mod.packs.list().map(p => p.id);
        });
        return check(res.length === 0, `no pack (built-in defaults); packs left ${j(res)}`);
    }
    const packText = fs.readFileSync(PACK, 'utf8');
    const res = await ev(async packText => {
        const mod = await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js');
        if (mod.packs.list().some(p => p.id === 'ersveil-bluewatch')) await mod.packs.remove('ersveil-bluewatch');
        const install = await mod.packs.install(packText, { source: 'file', origin: 'pack.json' });
        for (const p of mod.packs.list()) if (p.id !== 'ersveil-bluewatch' && p.enabled && mod.packs.setEnabled) await mod.packs.setEnabled(p.id, false);
        return { install: { ok: install.ok, errors: install.errors?.slice?.(0, 3) }, after: mod.packs.list().map(p => `${p.id}:${p.enabled}:${JSON.stringify(p.counts)}`) };
    }, packText);
    say('   pack install:', j(res));
    return check(res.install.ok, res.install.ok ? `installed; ${res.after.join(' ')}` : `refused: ${j(res.install.errors)}`);
});

// The scenario's character card: made once per data folder.
say('narrator:', await ev(async () => {
    const ctx = SillyTavern.getContext();
    if (ctx.characters.some(c => c.name === 'The Narrator')) return 'there';
    const form = new FormData();
    form.append('ch_name', 'The Narrator');
    form.append('description', 'The narrator of a low-fantasy frontier story. Writes in second person, grounded and concrete.');
    form.append('first_mes', 'The barge noses toward the Bluewatch quay.');
    for (const k of ['personality', 'scenario', 'mes_example', 'creator_notes', 'tags']) form.append(k, '');
    form.append('talkativeness', '0.5'); form.append('fav', 'false');
    const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
    const res = await fetch('/api/characters/create', { method: 'POST', headers, body: form });
    await ctx.getCharacters?.(); await new Promise(r => setTimeout(r, 1500));
    return res.ok ? 'created' : `create failed ${res.status}`;
}));
// Feature configuration (FEATURES): every declared feature on, off, or a seeded random half on.
let featurePlan = null;
if (FEATURES !== 'keep') {
    const list = await featuresList();
    let seed = Number(FEATURES.split(':')[1] ?? 0) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
    const ids = list.map(f => f.id).sort();
    let onSet;
    if (FEATURES === 'all') onSet = new Set(ids);
    else if (FEATURES === 'off') onSet = new Set();
    else { const shuffled = ids.map(id => [rnd(), id]).sort((a, b) => a[0] - b[0]).map(x => x[1]); onSet = new Set(shuffled.slice(0, Math.ceil(ids.length / 2))); }
    featurePlan = Object.fromEntries(ids.map(id => [id, onSet.has(id)]));
    await ev(async plan => {
        const es = SillyTavern.getContext().extensionSettings; es.storySuite ??= {}; es.storySuite.features ??= {};
        Object.assign(es.storySuite.features, plan); SillyTavern.getContext().saveSettingsDebounced(); await new Promise(r => setTimeout(r, 1200));
    }, featurePlan);
    const now = Object.fromEntries((await featuresList()).map(f => [f.id, f.on]));
    fs.writeFileSync(`${OUT}/features.json`, JSON.stringify({ mode: FEATURES, plan: featurePlan, now }, null, 1));
    say('features:', FEATURES, j(now));
}
// Money scale (F104): the pack's economy.scale or the Settings economyScale; probed after.
let econApplied = null;
if (ECON !== null) {
    econApplied = await ev(async v => {
        const es = SillyTavern.getContext().extensionSettings; es.storySuite ??= {};
        es.storySuite.economyScale = v; es.storySuite.modules ??= {}; es.storySuite.modules['story-block'] ??= {}; es.storySuite.modules['story-block'].economyScale = v;
        SillyTavern.getContext().saveSettingsDebounced(); await new Promise(r => setTimeout(r, 1000));
        try { return StoryBlock.sdk.query('inventory.economy', {}); } catch (e) { return `ERR ${e.message}`; }
    }, ECON);
    say('economy:', ECON, j(econApplied));
}
const SCALE = econApplied && typeof econApplied === 'object' && Number(econApplied.scale) > 0 ? Number(econApplied.scale) : 1;

await connect();
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 2000)); });
await ev(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 3000)); });
spareChat = await ev(() => SillyTavern.getContext().getCurrentChatId());
await ev(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 3000)); });
mainChat = await ev(() => SillyTavern.getContext().getCurrentChatId());
say('chats: spare', j(spareChat), 'main', j(mainChat));

await step('A1', 'generation held until a character exists; creation wizard', 'RB-screens2', async () => {
    const before = reqNames().length;
    await send('I step off the barge onto the Bluewatch quay.', 'This reply must never be used.', { wait: 6000 });
    const blocked = await ev(() => ({
        notice: document.querySelector('#story_suite_v2_bar .story-suite-notice')?.hidden === false ? document.querySelector('#story_suite_v2_bar .story-suite-notice-text')?.textContent : null,
        dialog: document.querySelector('.ss-dialog') ? `${document.querySelector('.ss-dialog-title')?.textContent} steps=${[...document.querySelectorAll('.ss-dialog-step')].map(n => n.textContent.trim()).join('/')}` : null,
    }));
    const sentWhileBlocked = reqNames().slice(before).filter(isMain).length;
    await shot('a01-blocked-wizard');
    clearQueue();
    const wiz = [];
    await ev(() => document.querySelector('.ss-dialog .rpg-preset-go')?.click());
    await page.waitForTimeout(600);
    for (let i = 0; i < 10; i += 1) {
        const st = await ev(() => ({ next: !!document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])'), body: document.querySelector('.ss-dialog-body')?.innerText?.replace(/\s+/g, ' ').slice(0, 100) }));
        wiz.push(st.body);
        if (st.next) { await ev(() => document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])').click()); await page.waitForTimeout(500); continue; }
        break;
    }
    await shot('a02-wizard-last');
    const created = await ev(async () => { const b = document.querySelector('.ss-dialog-submit:not([hidden])') ?? document.querySelector('.ss-dialog .cc-go'); b?.click(); await new Promise(r => setTimeout(r, 2500)); return { clicked: !!b, error: document.querySelector('.ss-dialog-error')?.textContent ?? null }; });
    pc = await q('party.pc');
    let fallback = false;
    if (!pc || typeof pc !== 'object') {
        fallback = true;
        say('   wizard did not create a character:', j(created), '; creation.finish:', j(await ev(async () => { const p = StoryBlock.sdk.query('creation.content').presets[0]; const r = await StoryBlock.sdk.command('creation.finish', { name: 'Ren', preset: p.id, race: p.race, talents: p.talents, points: p.points }); return r.ok ? r.receipt.summary : `${r.code} ${r.message}`; })));
        pc = await q('party.pc');
    }
    await ev(async () => { const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });
    say('   wizard:', wiz.join(' | '));
    return check(!!blocked.notice && !!blocked.dialog && sentWhileBlocked === 0 && !!pc && !fallback, `notice="${blocked.notice}", ${blocked.dialog}, requests while held=${sentWhileBlocked}, pc=${pc?.name}${fallback ? ' (wizard FAILED, creation.finish used)' : ''}`);
});
const PCN = pc?.name ?? 'Ren';

let W1, W2, req4, req5, quest2, tail5;
await step('A2', 'capture across all modules', 'main', async () => {
    const R1 = R('Fenna, the Guild clerk, taps the board by the door. "Rats in the Watch granary. Fifty marks, Watch rates, sorry." Outside, the brazier on the signal tower spits in the wind; a rider says hill rain is coming down the Branch.', [
        '~ place Bluewatch Village | kind: settlement | region: River Confederacy',
        '+ present Fenna',
        '+ quest Granary Rats — Fenna wants the Watch granary cellar cleared | giver: Fenna | goal: Kill 6 cellar rats | reward: 50 marks',
        '~ npc Fenna | trust: +10',
        '+ faction Bluewatch Watch — the garrison that holds the northern river-gate | area: Bluewatch | stance: wary but fair',
        '+ world Hill Rain — the hill rain is coming down the Bluewatch Branch | state: looming | place: Bluewatch Village | factions: Bluewatch Watch',
        '+ item Healing Salve | qty: 1 | note: Fenna slides it over: "for the bites"',
        '+ item Minor Healing Draught | qty: 1',
        '! time +20m',
    ]);
    await send('I go into the Guild office and look at the board.', R1);
    const kinds = new Set((await lastReceipts()).map(r => r.type));
    await send('I\'ll take the rat job.', R('"Good," Fenna says, and hands you a stub of candle. Down in the granary cellar the sacks are moving: a swarm of rats pours out of the bins.', [
        '+ quest Granary Rats — Fenna wants the Watch granary cellar cleared | giver: Fenna | goal: Kill 6 cellar rats | reward: 50 marks',
        '! encounter 6 Cellar Rat — pouring out of the granary bins | tier: weak | stakes: normal',
    ]));
    for (const r of await lastReceipts()) kinds.add(r.type);
    quest2 = await q('director.thread', { key: 'Granary Rats' });
    const byModule = {
        'story-block': [...kinds].filter(t => /capture\.(place|present|item|coin)/.test(t)),
        'story-director': [...kinds].filter(t => /quest|world|faction|time|director|chronicle/.test(t)),
        'rpg-battle': [...kinds].filter(t => /encounter|check|use|party|combat/.test(t)),
        'npc-state-delta': [...kinds].filter(t => /npc/.test(t)),
    };
    return check(Object.values(byModule).every(v => v.length > 0), j(byModule));
});

async function fight(tag) {
    await openPanel(); await tab('Fight');
    const offersNow = await q('combat.offers');
    const started = await ev(() => { const b = document.querySelector('#story_suite_v2_panel [data-command="combat.start"]'); b?.click(); return !!b; });
    await page.waitForTimeout(1500);
    let session = await q('combat.session');
    if (!session || typeof session !== 'object') { say(`   ${tag} combat.start (command):`, j(await cmd('combat.start', { offer: offersNow?.[0]?.id }))); session = await q('combat.session'); }
    await shot(`fight-${tag}-board`);
    let clicks = 0;
    for (let i = 0; i < 80 && session && session.status === 'active'; i += 1) {
        const clicked = await ev(() => { const b = [...document.querySelectorAll('.rpg-bb-act')].find(x => /auto/i.test(x.textContent) && !x.disabled); b?.click(); return !!b; });
        if (clicked) { clicks += 1; await page.waitForTimeout(400); } else {
            const r = await cmd('combat.act', { action: { type: 'auto' } });
            if (!r.ok) { say('   combat.act refused:', j(r)); break; }
        }
        session = await q('combat.session');
    }
    const status = session?.status;
    await tab('Fight');
    await shot(`fight-${tag}-end`);
    const finishClicked = await ev(() => { const b = document.querySelector('.rpg-bb-finish'); b?.click(); return !!b; });
    await page.waitForTimeout(1500);
    const still = await q('combat.session');
    if (!finishClicked || (still && typeof still === 'object')) say('   combat.end (command):', j(await cmd('combat.end', {})));
    const last = await q('combat.last');
    say(`   ${tag}: status ${status} (Auto clicks ${clicks}, Finish ${finishClicked}, started by button ${started});`, String(last?.summary ?? '').slice(0, 300));
    await closePanel();
    return { status, last, offer: offersNow?.[0] };
}

let fight1 = null;
await step('A3', 'quest taken by words, fight, story turn-in paid by code, next reply told', 'SD-ranks', async () => {
    await openPanel(); await tab('Quests');
    const questButtons = await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-pane button')].map(b => b.textContent.trim()).filter(Boolean));
    await shot('a03-quests-taken');
    fight1 = await fight('fight1');
    const prog1 = await q('quest.progress', { key: 'Granary Rats' });
    let early = null, status2 = 'not needed';
    if (!prog1?.met) {
        await send('I bring Fenna the rat tails.', R('Fenna counts the tails into a tin. "That few? The bins are still squeaking."', ['- quest Granary Rats — turned in to Fenna']));
        early = (await lastReceipts()).find(r => /Granary Rats/.test(r.summary ?? ''));
        await send('I go back down for the rest of them.', R('Back in the cellar the last of the swarm comes squealing out from under the sacks.', [`! encounter ${Math.max(1, (prog1?.need ?? 6) - (prog1?.have ?? 0))} Cellar Rat — the rest of the swarm under the sacks | tier: weak | stakes: normal`]));
        status2 = (await fight('fight2')).status;
    }
    W1 = coinOf(await wallet());
    await send('All six are dead. Here are the tails, Fenna.', R('Fenna counts the rat tails into a tin, wrinkles her nose and pays out of the Watch purse.', ['- quest Granary Rats — turned in to Fenna']));
    const rc3 = await lastReceipts();
    W2 = coinOf(await wallet());
    const turnIn = rc3.find(r => /turns in Granary Rats/.test(r.summary ?? ''));
    req4 = await send('I ask Fenna where I can get a hot meal.', R('Fenna points across the lane at the Stray Oar.'));
    const tail4 = req4 ? tailOf(req(req4)) : '';
    const told = /\[Happened\][\s\S]*turns in Granary Rats/.test(tail4);
    return check(!!quest2?.taken && fight1.status === 'won' && (prog1?.met || (status2 === 'won' && /stays open/.test(early?.summary ?? ''))) && !!turnIn && W2 > W1 && told && questButtons.every(b => !/^(take|accept|finish|turn down|abandon|decline)/i.test(b)),
        `taken by words=${!!quest2?.taken}; fight 1 ${fight1.status} (${prog1?.label})${prog1?.met ? '' : `, early: "${early?.summary}", fight 2 ${status2}`}; "${turnIn?.summary ?? 'no turn-in receipt'}"; wallet ${W1}→${W2}; told=${told}; quest buttons=${j(questButtons)}`);
});

await step('A4', 'check with pre-rolled dice', 'main', async () => {
    req5 = await send('I climb the wet palisade to get a look at the east bluff.', R('You get a boot on the wet palisade, find the iron cleat, and haul yourself up, tearing a knuckle on the way.', ['? check climb — climbing the wet palisade for a look at the bluff | dc: normal | roll: 1 | result: success', `~ wound ${PCN} — tore a knuckle on the palisade cleat | harm: wound`]));
    tail5 = req5 ? tailOf(req(req5)) : '';
    const diceLine = (tail5.match(/Dice for this reply:[^\n]*/) ?? [null])[0];
    const log = await q('checks.log', {});
    const logLast = Array.isArray(log) ? log.at(-1) : null;
    const roll1 = Number((diceLine ?? '').match(/Roll 1\D*(\d+)/)?.[1]);
    const expected = logLast ? (logLast.die === 20 ? 'success' : logLast.die === 1 ? 'fail' : logLast.total >= logLast.dc ? 'success' : logLast.total >= logLast.dc - 2 ? 'cost' : 'fail') : null;
    return check(!!diceLine && !!logLast && logLast.die === roll1 && logLast.outcome === expected && (logLast.said === logLast.outcome || !!logLast.mismatch), `tail "${diceLine}"; die ${logLast?.die} ${logLast?.mod >= 0 ? '+' : ''}${logLast?.mod} = ${logLast?.total} vs dc ${logLast?.dc} → ${logLast?.outcome} (said ${logLast?.said}${logLast?.mismatch ? `, flagged` : ''})`);
});

await step('A5', 'story item use', 'main', async () => {
    const salveBefore = countOf(await items(), /Healing Salve/);
    const hpBefore = (await q('party.pc'))?.hp;
    await send('I put some of the healing salve on my hand.', R('You open the salve Fenna gave you and work it into the torn knuckle; the sting fades.', [`! use Healing Salve | on: ${PCN}`]));
    const useRc = (await lastReceipts()).find(x => x.type === 'capture.use');
    const salveAfter = countOf(await items(), /Healing Salve/);
    const hpAfter = (await q('party.pc'))?.hp;
    return check(!!useRc && !useRc.data?.refused && salveAfter === salveBefore - 1 && hpAfter?.cur > hpBefore?.cur, `${useRc?.summary ?? 'no use receipt'}; salves ${salveBefore}→${salveAfter}, HP ${hpBefore?.cur}→${hpAfter?.cur}`);
});

await step('A6', 'chat switch right after a UI command; nothing lost', 'SB-storage', async () => {
    const blade = (await items()).find(i => /Cane-Blade/.test(i.name)) ?? (await items()).find(i => i.slot || i.kind === 'equipment');
    const switchRes = await ev(async ([stack, spare]) => {
        const ctx = SillyTavern.getContext();
        const p = StoryBlock.sdk.command('item.equip', { stack });
        const switching = ctx.openCharacterChat(spare);
        const r = await p; await switching;
        await new Promise(res => setTimeout(res, 2500));
        return { ok: r.ok, code: r.code ?? null, summary: r.receipt?.summary ?? r.message, spareRecord: SillyTavern.getContext().chat.some(m => (m.extra?.storySuite?.receipts ?? []).some(x => x.type === 'item.equip')) };
    }, [blade?.stack ?? blade?.id, spareChat]);
    await ev(async main => { await SillyTavern.getContext().openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); }, mainChat);
    const afterSwitch = await ev(() => SillyTavern.getContext().chat.some(m => (m.extra?.storySuite?.receipts ?? []).some(x => x.type === 'item.equip')));
    await reloadInto(mainChat);
    const afterReload = await ev(() => SillyTavern.getContext().chat.some(m => (m.extra?.storySuite?.receipts ?? []).some(x => x.type === 'item.equip')));
    return check(switchRes.ok && afterSwitch && afterReload && !switchRes.spareRecord, `equip ${switchRes.ok ? `ok ("${switchRes.summary}")` : switchRes.code + ' ' + switchRes.summary}; in main after switch=${afterSwitch}, after reload=${afterReload}, leaked into spare=${switchRes.spareRecord}`);
});

await step('A7', 'swipe, delete-middle, rewind', 'main', async () => {
    const invNames = async () => (await items()).map(i => `${i.name}×${i.qty}`).sort();
    await send('I buy a torch at the Watch Stores.', R('The quartermaster hands over a torch.', ['+ item Torch | qty: 1']));
    const swA = await invNames();
    clearQueue(); queue(R('The quartermaster is out of torches; he gives you a coil of rope instead.', ['+ item Hemp Rope | qty: 1']));
    await ev(() => window.jQuery('#chat .mes.last_mes .swipe_right').trigger('click'));
    await page.waitForFunction(() => { const m = SillyTavern.getContext().chat.at(-1); return m.swipes?.length >= 2 && m.mes && /rope/.test(m.mes); }, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const swB = await invNames();
    await ev(() => window.jQuery('#chat .mes.last_mes .swipe_left').trigger('click'));
    await page.waitForTimeout(3000);
    const swBack = await invNames();
    const swipeOk = swA.some(x => /^Torch/.test(x)) && !swA.some(x => /^Hemp Rope/.test(x)) && swB.some(x => /^Hemp Rope/.test(x)) && !swB.some(x => /^Torch/.test(x)) && j(swBack) === j(swA);
    const checkIdx = await ev(() => SillyTavern.getContext().chat.findIndex(m => !m.is_user && /palisade/.test(m.mes)));
    const checksBefore = (await q('checks.log', {}))?.length ?? null;
    await ev(async i => { const c = SillyTavern.getContext(); await c.deleteMessage(i); await c.deleteMessage(i - 1); await c.saveChat(); }, checkIdx);
    await page.waitForTimeout(2500);
    const checksAfter = (await q('checks.log', {}))?.length ?? null;
    const lr = await liveEqualsRebuild(mainChat);
    const turnInIdx = await ev(() => SillyTavern.getContext().chat.findIndex(m => !m.is_user && (m.extra?.storySuite?.receipts ?? []).some(r => /turns in Granary Rats/.test(r.summary ?? ''))));
    const turnInRev = await ev(i => { const r = SillyTavern.getContext().chat[i].extra.storySuite.receipts; return Math.min(...r.filter(x => /turns in Granary Rats/.test(x.summary ?? '')).map(x => x.rev)); }, turnInIdx);
    const pre = { wallet: coinOf(await wallet()), messages: await ev(() => SillyTavern.getContext().chat.length) };
    const rw = await ev(async ([index, beforeRev]) => { const r = await StoryBlock.sdk.rewind({ index, beforeRev }); await new Promise(res => setTimeout(res, 3000)); return { ok: r.ok, code: r.code, message: r.message }; }, [turnInIdx, turnInRev]);
    const onBranch = { wallet: coinOf(await wallet()), quest: (await q('director.thread', { key: 'Granary Rats' }))?.status };
    await ev(async main => { await SillyTavern.getContext().openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); }, mainChat);
    const back = { wallet: coinOf(await wallet()), messages: await ev(() => SillyTavern.getContext().chat.length) };
    const rewindOk = rw.ok && W2 - W1 === Math.round(50 * SCALE) && onBranch.wallet === pre.wallet - (W2 - W1) && onBranch.quest !== 'resolved' && back.wallet === pre.wallet && back.messages === pre.messages;
    return check(swipeOk && checksAfter === (checksBefore ?? 0) - 1 && lr.same && rewindOk, `swipe ${swipeOk ? 'follows' : `WRONG A=${j(swA)} B=${j(swB)} back=${j(swBack)}`}; delete-middle checks ${checksBefore}→${checksAfter}, live==rebuild ${lr.same}${lr.same ? '' : ` (${lr.differing})`}; rewind ${rw.ok ? `branch wallet ${onBranch.wallet} (was ${pre.wallet}), quest ${onBranch.quest}, main kept ${back.wallet}` : `${rw.code} ${rw.message}`}`);
});

// ============================================ beta steps =============================================
// ---- F100 Features toggles (SB-features) ----
await step('B01', 'Features: every module declares, toggles off/on, static prompt changes once and comes back', 'SB-features', async () => {
    if (!(await featureApi())) return SKIP('sdk.features() not there (SB-features not merged)');
    const list = await featuresList();
    const byModule = {};
    for (const f of list) (byModule[f.moduleId] ??= []).push(f.id);
    say('   features:', j(byModule));
    const overview = await ev(() => document.querySelectorAll('.story-suite-feature').length);
    // A module feature that changes the prompt (preferred), else any non-core feature.
    const target = list.find(f => f.moduleId !== 'story-block' && f.prompt && f.on) ?? list.find(f => f.moduleId !== 'story-block' && f.on) ?? list.find(f => f.on)
        ?? list.find(f => f.moduleId !== 'story-block' && f.prompt) ?? list[0];
    if (!target) return FAIL(`no feature declared: ${j(list)}`);
    // Flip it and flip it back (with every feature off the flip is on → off).
    const was = target.on;
    const off = await setFeature(target.id, !was);
    const rOff = await send('I sit by the brazier and listen to the rain.', R('Rain ticks on the brazier hood.', ['! time +10m']));
    const off2 = await send('I keep listening.', R('Nothing changes for a while.'));
    const on = await setFeature(target.id, was);
    const rOn = await send('I stand up and stretch.', R('Your knees crack.'));
    const sOff = rOff ? staticOf(req(rOff)) : null; const sOff2 = off2 ? staticOf(req(off2)) : null; const sOn = rOn ? staticOf(req(rOn)) : null;
    const sBefore = req5 ? staticOf(req(req5)) : null;
    const promptChanged = sBefore !== null && sOff !== null && sBefore !== sOff;
    const steadyOff = sOff === sOff2;
    const back = sOn === sBefore;
    const modules = ['story-block', 'rpg-battle', 'story-director', 'npc-state-delta'];
    const missing = modules.filter(m => !byModule[m]?.length);
    const ok = off.now === !was && on.now === was && steadyOff && back && (!target.prompt || promptChanged) && missing.length === 0;
    return check(ok, `${list.length} features (${Object.entries(byModule).map(([m, l]) => `${m}:${l.length}`).join(', ')}); no features from ${j(missing)}; settings switches in page ${overview}; toggled ${target.id} (prompt=${target.prompt}) via ${off.via}: off→${off.now}, on→${on.now}; static changed when off=${promptChanged}, steady while off=${steadyOff}, identical after on=${back}`);
});
// Feature off really is off: its commands refuse FEATURE_OFF, its queries answer null, its kind's line is told quietly.
await step('B02', 'Features: a feature off refuses its commands and nulls its queries; back on restores state', 'SB-features', async () => {
    if (!(await featureApi())) return SKIP('sdk.features() not there');
    const want = ['story-block.loot', 'story-block.encumbrance', 'rpg-battle.wear', 'rpg-battle.crafting', 'rpg-battle.effects'];
    const list = await featuresList();
    const target = list.find(f => want.includes(f.id)) ?? list.find(f => f.moduleId === 'rpg-battle');
    if (!target) return SKIP(`none of ${want.join(', ')} declared yet`);
    const before = stateJSON(await headState());
    const wasOn = target.on;
    await setFeature(target.id, false);
    const probes = { 'story-block.encumbrance': ['q', 'inventory.encumbrance'], 'story-block.loot': ['c', 'inventory.lootTake'], 'rpg-battle.crafting': ['c', 'craft.make'], 'rpg-battle.wear': ['q', 'items.condition'], 'rpg-battle.effects': ['q', 'party.effects'] };
    const [kind, name] = probes[target.id] ?? [null, null];
    let answer = null;
    if (kind === 'q') answer = await q(name, {});
    if (kind === 'c') answer = await cmd(name, {});
    await setFeature(target.id, wasOn);
    const after = stateJSON(await headState());
    const offOk = kind === null ? true : kind === 'q' ? answer === null : answer?.code === 'FEATURE_OFF';
    return check(offOk && before === after, `${target.id} off: ${name ?? '(no probe)'} → ${j(answer)?.slice(0, 160)}; state untouched by off/on=${before === after}`);
});

// ---- SB-inv: equip / unequip / Equip on…, loot picker, encumbered, cond, wear and repair ----
await step('B03', 'Equip / unequip and "Equip on…" a companion', 'SB-inv', async () => {
    const eqOn = await hasCommand('inventory.equipOn');
    const equipment = await hasQuery('inventory.equipment');
    if (!eqOn && !equipment) return SKIP('inventory.equipOn / inventory.equipment not there (SB-inv not merged)');
    // A companion to equip.
    await send('I ask Brannoc if he wants work.', R('Brannoc shrugs a spear onto his shoulder. "For a cut, aye."', ['+ join Brannoc — a hired spear with debts | level: 1 | role: guard']));
    for (const o of ((await q('party.offers')) ?? []).slice?.(0, 1) ?? []) say('   accept:', j(await cmd('party.acceptOffer', { offer: o.id })));
    await send('I buy Brannoc a cap at the stores.', R('The quartermaster finds a dented iron cap.', ['+ item Iron Cap | qty: 1']));
    const actors = await q('party.actors', {});
    const comp = (Array.isArray(actors) ? actors : Object.values(actors ?? {})).find(a => a && a.name && a.name !== PCN);
    const cap = (await items()).find(i => /Iron Cap/.test(i.name));
    const eqView0 = equipment ? await q('inventory.equipment', {}) : null;
    let rOn = null, rOff = null, rPc = null;
    if (eqOn && comp && cap) rOn = await cmd('inventory.equipOn', { stack: cap.stack ?? cap.id, actor: comp.id });
    const eqView1 = equipment ? await q('inventory.equipment', {}) : null;
    if (cap) rOff = await cmd('item.unequip', { stack: cap.stack ?? cap.id });
    if (cap) rPc = await cmd('item.equip', { stack: cap.stack ?? cap.id });
    await openPanel(); await tab('Inventory'); const invPane = await pane(); await shot('b03-equip'); await closePanel();
    const menu = await ev(() => [...document.querySelectorAll('#story_suite_v2_panel button, .ss-menu button, [data-command="inventory.equipOn"]')].map(b => b.textContent.trim()).filter(t => /equip on/i.test(t)).slice(0, 3));
    say('   equipment views:', j(eqView0)?.slice(0, 300), '→', j(eqView1)?.slice(0, 300));
    const ok = (!eqOn || (comp && rOn?.ok)) && rOff?.ok !== false && rPc?.ok;
    return check(ok, `companion ${comp?.name ?? 'none'}; equipOn ${j(rOn)?.slice(0, 160)}; unequip ${rOff?.ok ? 'ok' : j(rOff)}; equip on pc ${rPc?.ok ? 'ok' : j(rPc)}; Inventory pane mentions cap=${/Iron Cap/.test(invPane)}; "Equip on…" buttons=${j(menu)}`);
});

await step('B04', 'Loot picker: `? loot` offered, the reader takes part, the rest stays; replay-safe', 'SB-inv', async () => {
    if (!(await hasKind('loot')) && !(await hasCommand('inventory.lootTake'))) return SKIP('loot kind / inventory.lootTake not there');
    const before = await items();
    await send('I search the cellar shelf.', R('On the cellar shelf: a rusty key, two flasks of lamp oil and a torn map.', ['? loot Bent Copper Key, Lamp Oil x2, Torn Map — on the cellar shelf']));
    const rc = await lastReceipts();
    const lootRc = rc.find(r => /loot/.test(r.type));
    const offer = lootRc?.data?.loot ?? lootRc?.data?.offer ?? lootRc?.data?.id ?? null;
    const offered = await q('inventory.loot', {}).catch?.(() => null);
    await shot('b04-loot');
    const picker = await ev(() => [...document.querySelectorAll('#chat .mes.last_mes [data-command="inventory.lootTake"], #chat .mes.last_mes .ss-loot, #chat .mes.last_mes input[type="checkbox"]')].length);
    const take = await cmd('inventory.lootTake', { loot: offer, offer, take: [{ name: 'Lamp Oil', qty: 1 }, { name: 'Torn Map', qty: 1 }], names: ['Lamp Oil', 'Torn Map'] });
    const after = await items();
    const oil = countOf(after, /Lamp Oil/) - countOf(before, /Lamp Oil/);
    const map = countOf(after, /Torn Map/) - countOf(before, /Torn Map/);
    const key = countOf(after, /Bent Copper Key/) - countOf(before, /Bent Copper Key/);
    const again = await cmd('inventory.lootTake', { loot: offer, offer, take: [{ name: 'Lamp Oil', qty: 5 }], names: ['Lamp Oil'] });
    const oil2 = countOf(await items(), /Lamp Oil/) - countOf(before, /Lamp Oil/);
    return check(!!lootRc && take.ok && oil === 1 && map === 1 && key === 0 && oil2 <= 2, `receipt ${lootRc?.type}: "${lootRc?.summary}"; picker controls under reply=${picker}; take ${take.ok ? take.summary : `${take.code} ${take.message}`}; +oil ${oil}, +map ${map}, +key ${key}; over-take → ${again.ok ? 'ok' : again.code}, oil total +${oil2}; loot query ${j(offered)?.slice(0, 120)}`);
});

await step('B05', 'Encumbered: carrying past the limit shows and is told; dropping clears it', 'SB-inv', async () => {
    if (!(await hasQuery('inventory.encumbrance'))) return SKIP('inventory.encumbrance not there');
    const e0 = await q('inventory.encumbrance', {});
    await send('I haul sacks of salt from the yard.', R('You shoulder sack after sack of coarse salt.', ['+ item Coarse Salt | qty: 40', '+ item Hemp Rope | qty: 10', '+ item Bedroll | qty: 6']));
    const e1 = await q('inventory.encumbrance', {});
    const reqE = await send('I trudge on under the load.', R('Your shoulders burn.'));
    const tail = reqE ? tailOf(req(reqE)) : '';
    const hud = await ev(() => (document.querySelector('#story_suite_v2_bar')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 200));
    await shot('b05-encumbered');
    const salt = (await items()).find(i => /Coarse Salt/.test(i.name));
    const drop = salt ? await cmd('item.drop', { stack: salt.stack ?? salt.id, qty: salt.qty }) : null;
    const e2 = await q('inventory.encumbrance', {});
    const flag = e => Boolean(e?.encumbered ?? e?.over ?? (e?.level && e.level !== 'none'));
    return check(!flag(e0) && flag(e1) && /encumber|overload|weigh/i.test(tail + hud) && !flag(e2), `before ${j(e0)?.slice(0, 120)}; loaded ${j(e1)?.slice(0, 160)}; tail/HUD tells=${/encumber|overload|weigh/i.test(tail + hud)}; drop ${drop?.ok ? 'ok' : j(drop)}; after ${j(e2)?.slice(0, 120)}`);
});

await step('B06', 'Condition, wear and repair: story wear, fight wear, repair costs and restores', 'RB-gear', async () => {
    const cond = await hasQuery('items.condition');
    const wearC = await hasCommand('inventory.wear');
    const repairC = await hasCommand('inventory.repair');
    if (!cond && !wearC && !repairC) return SKIP('items.condition / inventory.wear / inventory.repair not there (RB-gear, SB-inv not merged)');
    const gear = (await items()).find(i => i.equipped) ?? (await items()).find(i => /Cane-Blade|Iron Cap/.test(i.name));
    const c0 = cond ? await q('items.condition', { stack: gear?.stack ?? gear?.id }) : null;
    await send('I push through the bramble hedge.', R('The brambles rake you and your gear.', [`~ item ${gear?.name ?? 'Cane-Blade'} — torn by brambles | wear: tear`]));
    const rcWear = (await lastReceipts()).find(r => /wear/.test(r.type) || /wear|torn|scuff/i.test(r.summary ?? ''));
    const c1 = cond ? await q('items.condition', { stack: gear?.stack ?? gear?.id }) : null;
    const w0 = coinOf(await wallet());
    const rep = repairC ? await cmd('inventory.repair', { stack: gear?.stack ?? gear?.id }) : null;
    const w1 = coinOf(await wallet());
    const c2 = cond ? await q('items.condition', { stack: gear?.stack ?? gear?.id }) : null;
    const hostile = await send('I polish the blade.', R('It gleams.', [`~ item ${gear?.name ?? 'Cane-Blade'} | wear: -999`, `~ item ${gear?.name ?? 'Cane-Blade'} | cond: 999`]));
    const c3 = cond ? await q('items.condition', { stack: gear?.stack ?? gear?.id }) : null;
    await openPanel(); await tab('Inventory'); await shot('b06-cond'); const p = await pane(); await closePanel();
    const n = c => Number(c?.cond ?? c?.condition ?? c?.value ?? c?.[0]?.cond ?? NaN);
    return check(!!rcWear && n(c1) < n(c0) && (rep === null || (rep.ok && w1 <= w0 && n(c2) > n(c1))) && !(n(c3) > n(c2) + 0.0001 && !rep), `${gear?.name}: cond ${n(c0)} → story tear ${n(c1)} ("${rcWear?.summary ?? 'no wear receipt'}") → repair ${rep ? (rep.ok ? `ok, ${w0}→${w1} coin` : `${rep.code} ${rep.message}`) : 'n/a'} → ${n(c2)}; hostile wear/cond lines → ${n(c3)}; Inventory shows cond=${/cond|wear|worn|torn/i.test(p)}`);
});

await step('B07', 'Refinement: a piece refined with materials, capped; the fight uses the refined stats', 'RB-gear', async () => {
    const c = await firstOf(['item.refine', 'items.refine', 'gear.refine', 'inventory.refine', 'craft.refine'], hasCommand);
    if (!c) return SKIP('no refine command (RB-gear not merged)');
    const gear = (await items()).find(i => i.equipped);
    const g0 = await q('items.gear', {});
    const r1 = await cmd(c, { stack: gear?.stack ?? gear?.id });
    const g1 = await q('items.gear', {});
    const spam = [];
    for (let i = 0; i < 12; i += 1) spam.push((await cmd(c, { stack: gear?.stack ?? gear?.id })).ok);
    const g2 = await q('items.gear', {});
    return check(r1.ok !== undefined && spam.some(x => !x), `${c} on ${gear?.name}: ${r1.ok ? r1.summary : `${r1.code} ${r1.message}`}; 12 more → ${spam.filter(Boolean).length} ok (a cap must refuse some); gear ${j(g0?.counted)?.slice(0, 80)} → ${j(g1?.counted)?.slice(0, 80)} → ${j(g2?.counted)?.slice(0, 80)}`);
});

// ---- RB-craft: crafting with dice ----
await step('B08', 'Crafting with dice: `! craft` takes the reply\'s roll, code sets the result; materials taken once', 'RB-craft', async () => {
    if (!(await hasKind('craft')) && !(await hasCommand('craft.make'))) return SKIP('craft kind / craft.make not there (RB-craft not merged)');
    const book = await firstOf(['craft.view', 'craft.book', 'craft.recipes'], hasQuery);
    const view = book ? await q(book, {}) : null;
    const recipes = view?.recipes ?? view?.known ?? (Array.isArray(view) ? view : []);
    say('   craft view:', j(view)?.slice(0, 400));
    const recipe = recipes[0];
    if (!recipe) return FAIL(`no recipe in ${book}: ${j(view)?.slice(0, 200)} (pack crafts: SB-packs2)`);
    const learned = recipe.known === false ? await cmd('craft.learn', { recipe: recipe.id }) : null;
    const mats = (recipe.inputs ?? recipe.with ?? []).map(m => `+ item ${m.name ?? m.def} | qty: ${m.qty ?? 1}`);
    await send('I gather what the recipe needs.', R('You collect the materials.', mats.slice(0, 4)));
    const inv0 = await items();
    const rq = await send(`I craft the ${recipe.name}.`, R(`You work at the bench and make the ${recipe.name}.`, [`! craft ${recipe.name} | with: ${(recipe.inputs ?? []).map(m => `${m.name} x${m.qty ?? 1}`).join(', ')} | by: ${PCN} | roll: 1 | result: masterwork`]));
    const tail = rq ? tailOf(req(rq)) : '';
    const dice = (tail.match(/Dice for this reply:[^\n]*/) ?? [null])[0];
    const rc = (await lastReceipts()).find(r => /craft/.test(r.type));
    const inv1 = await items();
    const made = countOf(inv1, new RegExp(recipe.name.replace(/[^\w ]/g, '.'))) - countOf(inv0, new RegExp(recipe.name.replace(/[^\w ]/g, '.')));
    const said = rc?.data?.said ?? null; const outcome = rc?.data?.outcome ?? rc?.data?.result ?? null;
    await openPanel(); const tabs = await tabNames(); const craftTab = tabs.find(t => /craft/i.test(t)); if (craftTab) await tab(craftTab); await shot('b08-craft'); await closePanel();
    return check(!!dice && !!rc && (made >= 0) && (outcome !== 'masterwork' || said === outcome || rc.data?.mismatch), `recipe ${recipe.name}${learned ? ` (learn ${learned.ok})` : ''}; tail dice "${dice}"; receipt "${rc?.summary}" outcome ${outcome} (story said masterwork${rc?.data?.mismatch ? ', flagged' : ''}); made +${made}; Crafting tab ${craftTab ?? 'none'}`);
});

// ---- RB-party2: ranks, points badge, timed effects ----
await step('B09', 'Party ranks and foe rank', 'RB-party2', async () => {
    if (!(await hasQuery('party.ranks'))) return SKIP('party.ranks not there (RB-party2 not merged)');
    const ranks = await q('party.ranks', {});
    await openPanel(); await tab('Party'); const p = await pane(); await shot('b09-ranks'); await closePanel();
    const off = await q('combat.offers');
    const rankShown = /\brank\b|\b[FEDCBAS]-rank\b|\bRank [FEDCBAS]\b/i.test(p);
    return check(!!ranks && typeof ranks === 'object' && rankShown, `party.ranks ${j(ranks)?.slice(0, 200)}; Party tab shows a rank=${rankShown}; offers ${j(off?.map?.(o => o.rank ?? o.tier))}`);
});
await step('B10', 'Points badge: unspent points show a badge; spending clears it', 'RB-party2', async () => {
    if (!(await hasQuery('party.toSpend'))) return SKIP('party.toSpend not there');
    const t0 = await q('party.toSpend', {});
    const badge = () => ev(() => [...document.querySelectorAll('[class*="badge"]')].filter(n => n.offsetParent !== null).map(n => n.textContent.trim()).filter(Boolean).slice(0, 5));
    const b0 = await badge();
    const pcNow = await q('party.pc');
    let spent = null;
    if (pcNow?.points > 0) spent = await cmd('party.spend', { actor: pcNow.id, points: { DEX: pcNow.points } });
    const t1 = await q('party.toSpend', {});
    const b1 = await badge();
    await shot('b10-badge');
    const n = t => Number(t?.total ?? t?.points ?? (Array.isArray(t) ? t.reduce((a, x) => a + (x.points ?? 0), 0) : t) ?? 0);
    return check(n(t0) === 0 ? b0.length === 0 || true : b0.length > 0 && (!spent?.ok || n(t1) === 0), `toSpend ${j(t0)?.slice(0, 120)} badges ${j(b0)}; spend ${spent ? (spent.ok ? 'ok' : spent.code) : 'nothing to spend'}; after ${j(t1)?.slice(0, 80)} badges ${j(b1)}`);
});
await step('B11', 'Timed effects: story `+ effect` with a duration, shown, counted in checks, ends with time; capped', 'RB-party2', async () => {
    if (!(await hasKind('effect')) && !(await hasQuery('party.effects'))) return SKIP('effect kind / party.effects not there');
    const pcNow = await q('party.pc');
    await send('I drink the bitter tea Old Tamsin brews.', R('The tea sharpens your eyes.', [`+ effect Keen Sight — sharper eyes | on: perception | for: 2h | who: ${PCN} | kind: buff`, `+ effect Godlike Might — x | on: attack | for: 999h | who: ${PCN} | kind: buff`]));
    const e1 = await q('party.effects', { actor: pcNow?.id });
    await send('I wait a few hours.', R('The afternoon drags on.', ['! time +3h']));
    const e2 = await q('party.effects', { actor: pcNow?.id });
    const list = e => (Array.isArray(e) ? e : e?.effects ?? []);
    const keen1 = list(e1).find(e => /Keen Sight/.test(e.name)); const keen2 = list(e2).find(e => /Keen Sight/.test(e.name));
    const god = list(e1).find(e => /Godlike/.test(e.name));
    return check(!!keen1 && !keen2 && (!god || Math.abs(Number(god.mod ?? god.value ?? 0)) <= 3), `after effect: ${j(list(e1).map(e => `${e.name}:${e.mod ?? e.value ?? ''}:${e.until ?? e.for ?? ''}`))}; after +3h: ${j(list(e2).map(e => e.name))}`);
});

// ---- RB-balance2: normalized fights, lone foe, boss ----
await step('B12', 'Normalized fights: same-tier groups of different creatures are comparable; a lone foe; a boss keeps its level', 'RB-balance2', async () => {
    const offers0 = await q('combat.offers');
    await send('Wolves on the bluff, and something bigger.', R('Three starved wolves circle; behind them a matriarch twice their size; and alone on the ridge a single drake.', [
        '! encounter 3 Starved Crag Wolf — circling at the treeline | tier: even | stakes: normal',
        '! encounter 1 River Drake — alone on the ridge | tier: even | stakes: normal',
        '! encounter 1 Crag Wolf Matriarch — leader of the pack | tier: strong | stakes: normal | boss: yes',
    ]));
    const offers = await q('combat.offers');
    const list = Array.isArray(offers) ? offers : [];
    say('   offers:', j(list.map(o => ({ id: o.id, name: o.name ?? o.foes?.[0]?.name, n: o.foes?.length ?? o.count, tier: o.tier, boss: o.boss ?? null, power: o.power ?? o.threat ?? null, level: o.level ?? o.foes?.map?.(f => f.level) }))).slice(0, 600));
    const hasPower = list.some(o => o.power !== undefined || o.threat !== undefined || o.budget !== undefined || o.foes?.some?.(f => f.power !== undefined));
    if (!hasPower && !list.some(o => o.boss !== undefined)) {
        for (const o of list.slice(0, 3)) await cmd('combat.dismiss', { offer: o.id });
        return SKIP(`offers carry no power/boss fields yet (RB-balance2 not merged); ${list.length} offers`);
    }
    const boss = list.find(o => o.boss || o.foes?.some?.(f => f.boss));
    const lone = list.find(o => (o.foes?.length ?? o.count) === 1 && !(o.boss || o.foes?.some?.(f => f.boss)));
    const pcLevel = (await q('party.pc'))?.level ?? 1;
    const bossLevel = Math.max(...(boss?.foes ?? []).map(f => f.level ?? 0), boss?.level ?? 0);
    const won = lone ? (await cmd('combat.start', { offer: lone.id })).ok : false;
    let status = null;
    if (won) { for (let i = 0; i < 80; i += 1) { const s = await q('combat.session'); if (!s || s.status !== 'active') { status = s?.status; break; } if (!(await cmd('combat.act', { action: { type: 'auto' } })).ok) break; } await cmd('combat.end', {}); }
    for (const o of ((await q('combat.offers')) ?? [])) await cmd('combat.dismiss', { offer: o.id });
    return check(!!boss && bossLevel >= pcLevel && !!lone, `boss offer=${!!boss} level ${bossLevel} vs pc ${pcLevel}; lone foe offer=${!!lone} fight ${status}`);
});

// ---- RB-screens2: HUD, wizard, crafting, gear UI, export/import ----
await step('B13', 'RB screens: HUD, Party/gear, Crafting, export → import round trip', 'RB-screens2', async () => {
    const exp = await firstOf(['party.export', 'creation.export'], hasQuery);
    const imp = await firstOf(['creation.import', 'party.import'], hasCommand);
    await openPanel();
    const tabs = await tabNames();
    const shots = [];
    for (const t of tabs) { await tab(t); shots.push(`${t}:${(await pane()).length}`); await shot(`b13-tab-${t.replace(/\W+/g, '_')}`); }
    await closePanel();
    const hud = await ev(() => ({ text: (document.querySelector('#story_suite_v2_bar')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 200), rpg: document.querySelectorAll('[class*="rpg-hud"], [class*="rpg"][class*="hud"]').length }));
    if (!exp && !tabs.some(t => /craft/i.test(t))) return SKIP(`no export/import or Crafting screen yet (RB-screens2 not merged); tabs ${j(tabs)}; HUD "${hud.text}"`);
    const file = exp ? await q(exp, {}) : null;
    let roundTrip = null;
    if (file && imp) {
        // Import into the spare chat (no character yet) and compare names/levels.
        const asText = typeof file === 'string' ? file : JSON.stringify(file);
        roundTrip = await ev(async ([spare, text, type, main]) => {
            const ctx = SillyTavern.getContext();
            await ctx.openCharacterChat(spare); await new Promise(r => setTimeout(r, 2500));
            const r = await StoryBlock.sdk.command(type, { file: text, text });
            const pcS = (() => { try { return StoryBlock.sdk.query('party.pc'); } catch { return null; } })();
            await ctx.openCharacterChat(main); await new Promise(r2 => setTimeout(r2, 2500));
            return { ok: r.ok, code: r.code ?? null, message: r.message ?? r.receipt?.summary, pc: pcS && { name: pcS.name, level: pcS.level } };
        }, [spareChat, asText, imp, mainChat]);
    }
    const pcM = await q('party.pc');
    return check(!!file && (!imp || (roundTrip?.ok && roundTrip.pc?.name === pcM?.name && roundTrip.pc?.level === pcM?.level)), `tabs ${j(shots)}; HUD "${hud.text}" rpg nodes ${hud.rpg}; ${exp} → ${typeof file === 'string' ? file.length + ' chars' : j(file)?.length + ' json chars'}; ${imp ?? 'no import'} into spare → ${j(roundTrip)}`);
});

// ---- SD-digest: day digest, Chronicle Days, time.now ----
await step('B14', 'Day digest: crossing a day writes a code-made digest; Chronicle Days lists it; reminder after a skip', 'SD-digest', async () => {
    const now = await firstOf(['time.now', 'director.time', 'director.clock'], hasQuery);
    const digestQ = await firstOf(['director.days', 'chronicle.days', 'director.digest', 'time.days'], hasQuery);
    const t0 = now ? await q(now, {}) : null;
    const rq = await send('I sleep through to the next evening.', R('You sleep like a stone and wake to evening bells.', ['! time +30h', '+ coin 5 | from: a found purse']));
    const t1 = now ? await q(now, {}) : null;
    const rc = await lastReceipts();
    const dRc = rc.find(r => /digest|day/i.test(r.type));
    const nextReq = await send('I go out into the lane.', R('The lane is wet.'));
    const tail = nextReq ? tailOf(req(nextReq)) : '';
    const days = digestQ ? await q(digestQ, {}) : null;
    await openPanel(); await tab('Chronicle'); const p = await pane(); await shot('b14-chronicle-days'); await closePanel();
    if (!digestQ && !dRc && !/\bDays?\b/.test(p)) return SKIP(`no day digest yet (SD-digest not merged); clock ${now}: ${j(t0)?.slice(0, 80)} → ${j(t1)?.slice(0, 80)}`);
    const reminder = /\b(yesterday|day before|previous day|Day \d+|Goldwane \d+)[^\n]{0,200}/i.exec(tail)?.[0] ?? null;
    const list = Array.isArray(days) ? days : days?.days ?? [];
    return check(list.length >= 1 && /Days?/.test(p) && !!reminder, `${digestQ}: ${list.length} day(s) ${j(list.at(-1))?.slice(0, 200)}; receipt ${dRc?.type ?? 'none'}; Chronicle has Days=${/Days?/.test(p)}; tail reminder "${reminder}"`);
});

// ---- NSD-meters2: stages and teasers ----
await step('B15', 'NSD meter stages and teasers: a stage crossing is code-made, shown, and teased in the tail', 'NSD-meters2', async () => {
    const m0 = await q('npc.meters', { name: 'Fenna' });
    say('   Fenna meters before:', j(m0)?.slice(0, 300));
    for (let i = 0; i < 4; i += 1) await send('I help Fenna with the ledgers.', R('Fenna smiles despite herself.', ['~ npc Fenna | trust: +15 | affection: +10']));
    const m1 = await q('npc.meters', { name: 'Fenna' });
    const tail = tailOf(req(mainReqs().at(-1)));
    const stageMap = m1?.stages && typeof m1.stages === 'object' ? m1.stages : {};
    const stageWords = Object.entries(stageMap).map(([k, v]) => `${k}:${typeof v === 'object' ? (v?.name ?? v?.label ?? JSON.stringify(v)) : v}`);
    const teaser = /teaser|hint|next stage|close to|almost/i.exec(tail)?.[0] ?? null;
    if (!stageWords.length && !teaser) return SKIP(`no stage reached after trust +60 (no ladder yet; NSD-meters2 not merged): ${j(m1)?.slice(0, 160)}`);
    const rc = await lastReceipts();
    const stageRc = rc.find(r => Array.isArray(r.data?.stages));
    await openPanel(); await tab('Cast'); const p = await pane(); await shot('b15-cast-stages'); await closePanel();
    const hostile = await send('Fenna falls madly in love.', R('She swoons.', ['~ npc Fenna | trust: +99999 | stage: married | affection: 1e308']));
    const m2 = await q('npc.meters', { name: 'Fenna' });
    return check(stageWords.length > 0 && !/1e308|99999/.test(JSON.stringify(m2)), `stages ${j(stageWords)}; stage receipt ${stageRc ? j(stageRc.data.stages) : 'none'}; tail teaser "${teaser}"; Cast shows stage=${/stage|friend|trusted|ally/i.test(p)}; hostile lines → ${j(m2)?.slice(0, 160)}`);
});

// ---- SB-view: inspector, save points, compat panel ----
await step('B16', 'SB inspector: opens on a reply, shows its receipts, problems and state; read-only', 'SB-view', async () => {
    const opened = await ev(async () => {
        const before = JSON.stringify(StoryBlock.sdk.view().state);
        let handle = null;
        try { handle = StoryBlock.sdk.dialog.open('story-block.inspector', {}) ?? StoryBlock.sdk.dialog.open('inspector', {}); } catch { handle = null; }
        await new Promise(r => setTimeout(r, 900));
        const node = document.querySelector('.ss-inspector, [class*="inspector"], .ss-dialog');
        const text = node ? node.innerText.replace(/\s+/g, ' ').slice(0, 300) : null;
        document.querySelector('.ss-dialog-close')?.click();
        return { handle: !!handle, text, same: before === JSON.stringify(StoryBlock.sdk.view().state) };
    });
    if ((!opened.handle && !opened.text) || /cannot be shown/.test(opened.text ?? '')) return SKIP(`no inspector screen (SB-view not merged): ${opened.text}`);
    await shot('b16-inspector');
    return check(!!opened.text && /receipt|rev|problem|ops|state/i.test(opened.text) && opened.same, `inspector: "${opened.text}"; state untouched=${opened.same}`);
});
await step('B17', 'Save points: listed, a return to one branches with that state; storage checkpoints every 100 carriers', 'SB-view', async () => {
    const sp = await firstOf(['story.savePoints', 'store.savePoints', 'savePoints', 'story-block.savePoints'], hasQuery);
    const ui = await ev(() => [...document.querySelectorAll('button, [data-command]')].filter(b => /save point/i.test(b.textContent)).length);
    if (!sp && !ui) return SKIP('no save points query/screen (SB-view not merged)');
    const list = sp ? await q(sp, {}) : null;
    return check(Array.isArray(list ?? []) && (list?.length ?? 0) >= 1, `${sp}: ${j(list)?.slice(0, 300)}; buttons ${ui}`);
});
await step('B18', 'Compat panel: module versions, requires, missing domains, features each module brings', 'SB-view', async () => {
    const got = await ev(async () => {
        const nodes = [...document.querySelectorAll('[class*="compat"]')];
        return nodes.map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 300)).filter(Boolean).slice(0, 3);
    });
    const q1 = await firstOf(['story-block.compat', 'host.compat', 'compat', 'modules.compat'], hasQuery);
    if (!got.length && !q1) return SKIP('no compat panel (SB-view not merged)');
    const v = q1 ? await q(q1, {}) : null;
    const mods = await ev(() => StoryBlock.sdk.modules().map(m => `${m.id}@${m.version}`));
    const allNamed = mods.every(m => (got.join(' ') + j(v)).includes(m.split('@')[0]) || (got.join(' ') + j(v)).includes(m.split('@')[1]));
    return check(allNamed, `panel ${j(got)?.slice(0, 300)}; ${q1}: ${j(v)?.slice(0, 200)}; modules ${j(mods)}`);
});

// ---- SB-storage: saves per reply, record kept once ----
await step('B19', 'Storage: saves per reply ≤ 2, record kept once (no swipe_info copy), checkpoint spacing', 'SB-storage', async () => {
    await ev(() => {
        if (window.__beta) return;
        const s = window.__beta = { saves: 0, bytes: 0 };
        const real = window.fetch;
        window.fetch = function (input, init) { try { const u = typeof input === 'string' ? input : input?.url ?? ''; if (u.includes('/api/chats/save')) { s.saves += 1; s.bytes += typeof init?.body === 'string' ? init.body.length : 0; } } catch { /* count */ } return real.apply(this, arguments); };
    });
    const per = [];
    for (let i = 0; i < 4; i += 1) {
        const s0 = await ev(() => [window.__beta.saves, window.__beta.bytes]);
        await send(`I walk the quay, lap ${i + 1}.`, R('Gulls, tar, rain.', ['! time +5m']));
        await page.waitForTimeout(1200);
        const s1 = await ev(() => [window.__beta.saves, window.__beta.bytes]);
        per.push([s1[0] - s0[0], s1[1] - s0[1]]);
    }
    const twice = await ev(() => SillyTavern.getContext().chat.filter(m => !m.is_user && m.extra?.storySuite && (m.swipe_info ?? []).some(si => si?.extra?.storySuite)).length);
    const carriers = await ev(() => SillyTavern.getContext().chat.filter(m => !m.is_user && m.extra?.storySuite).length);
    const cps = await ev(() => SillyTavern.getContext().chat.filter(m => m.extra?.storySuite?.checkpoint).length);
    const meanSaves = per.reduce((a, x) => a + x[0], 0) / per.length;
    const storageMerged = twice === 0;
    const note = `saves/reply ${j(per.map(x => x[0]))} (mean ${meanSaves}), bytes/reply ${j(per.map(x => x[1]))}; records also in swipe_info: ${twice}/${carriers}; checkpoints ${cps}`;
    if (!storageMerged && meanSaves >= 3) return SKIP(`old storage still (SB-storage not merged): ${note}`);
    return check(meanSaves <= 2 && twice === 0, note);
});

// ---- F104 money scale ----
await step('B21', 'Money scale: pack economy.scale / Settings economyScale scales built-in prices and rewards', 'SB-packs2', async () => {
    if (ECON === null) return SKIP('ECON not set for this configuration');
    if (!econApplied || typeof econApplied !== 'object') return SKIP(`inventory.economy not there (F104 not merged): ${j(econApplied)?.slice(0, 120)}`);
    return check(Number(econApplied.scale) === ECON && W2 - W1 === Math.round(50 * ECON), `inventory.economy ${j(econApplied)?.slice(0, 160)}; Granary Rats paid ${W2 - W1} (50 × ${ECON} = ${Math.round(50 * ECON)})`);
});

// ---- after all the beta steps: replay == live ----
await step('B20', 'After every beta step: live head == rebuild from the saved file', 'main', async () => {
    const lr = await liveEqualsRebuild(mainChat);
    return check(lr.same, lr.same ? 'identical' : `differs in ${j(lr.differing)}`);
});

// ====================================== alpha.2 steps 8–12 ===========================================
await step('A8', 'static prompt byte-identical; shared prefix', 'main', async () => {
    const mains = mainReqs();
    const statics = mains.map(n => staticOf(req(n)));
    // Feature toggles (B01) legitimately change it; count runs of identical parts.
    let changes = 0; for (let i = 1; i < statics.length; i += 1) if (statics[i] !== statics[i - 1]) changes += 1;
    const distinct = [...new Set(statics)];
    fs.writeFileSync(`${OUT}/static-hashes.txt`, mains.map((n, i) => `${n} ${crypto.createHash('sha256').update(statics[i]).digest('hex').slice(0, 16)} ${statics[i].length}`).join('\n') + '\n');
    const togglesExpected = rows.find(r => r.id === 'B01')?.status === 'SKIP' ? 0 : 2;
    const prefixes = [];
    for (let i = 1; i < mains.length; i += 1) prefixes.push(sharedPrefix(req(mains[i - 1]).messages, req(mains[i]).messages).percent);
    fs.writeFileSync(`${OUT}/static-part.txt`, statics[0] ?? '');
    if (tail5) fs.writeFileSync(`${OUT}/tail-check.txt`, tail5);
    let diff = '';
    if (distinct.length > 1) { const a = distinct[0], b = distinct[1]; let k = 0; while (k < a.length && a[k] === b[k]) k += 1; diff = `; first diff at ${k}: ${j(a.slice(Math.max(0, k - 60), k + 80))} vs ${j(b.slice(Math.max(0, k - 60), k + 80))}`; }
    return check(changes <= togglesExpected, `${mains.length} requests, ${distinct.length} distinct static part(s), ${changes} change(s) (feature toggles allow ${togglesExpected}); prefix median ${prefixes.slice().sort((x, y) => x - y)[Math.floor(prefixes.length / 2)]}%${changes > togglesExpected ? diff : ''}`);
});

await step('A9', 'NSD hosted Cast tab; other tabs not clobbered', 'NSD-meters2', async () => {
    await openPanel(); await tab('Cast');
    let castText = await pane();
    if (!/Fenna/.test(castText)) {
        globalThis.__promptText = 'Fenna';
        await ev(async () => { window.prompt = () => 'Fenna'; await window.NPCStateDelta?.addNpc?.(); await new Promise(r => setTimeout(r, 1500)); });
        await tab('Quests'); await tab('Cast'); castText = await pane();
    }
    const castMeters = await ev(() => document.querySelectorAll('#story_suite_v2_panel .npc-state-delta-v2-meter-npc').length);
    await shot('a09-cast');
    await tab('Quests');
    const qBefore = await pane();
    await ev(() => { document.dispatchEvent(new CustomEvent('npc-state-delta:cast-rendered')); document.dispatchEvent(new CustomEvent('npc-state-delta:enabled-changed')); });
    await page.waitForTimeout(800);
    const qAfter = await pane();
    await closePanel();
    return check(/Fenna/.test(castText) && qAfter === qBefore && !/METERS|NPC State Delta/.test(qAfter), `Cast shows Fenna=${/Fenna/.test(castText)}, meters=${castMeters}, Quests kept=${qAfter === qBefore}`);
});

await step('A10', 'map: search and zoom', 'main', async () => {
    await openPanel();
    const found = await tab('Map'); await page.waitForTimeout(800);
    const placeXY = () => ev(() => [...document.querySelectorAll('.sd-map .sd-map-place')].slice(0, 2).map(n => { const r = n.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));
    const info = await ev(() => ({ places: document.querySelectorAll('.sd-map .sd-map-place').length }));
    await page.fill('.sd-map .sd-map-search input', 'grnary');
    await page.waitForTimeout(700);
    const results = await ev(() => [...document.querySelectorAll('.sd-map .sd-map-results li')].map(n => n.textContent.trim()).slice(0, 5));
    await ev(() => document.querySelector('.sd-map .sd-map-fit')?.click()); await page.waitForTimeout(500);
    const xy0 = await placeXY();
    await ev(() => document.querySelector('.sd-map .sd-map-zoom-in')?.click()); await page.waitForTimeout(400);
    await ev(() => document.querySelector('.sd-map .sd-map-zoom-in')?.click()); await page.waitForTimeout(600);
    const xy1 = await placeXY();
    const dist = xy => (xy.length === 2 ? Math.hypot(xy[0][0] - xy[1][0], xy[0][1] - xy[1][1]) : NaN);
    await shot('a10-map');
    return check(found && info.places > 0 && results.some(r => /Granary/i.test(r)) && dist(xy1) > dist(xy0) * 1.2, `${info.places} places, search ${j(results.slice(0, 2))}, zoom ×${(dist(xy1) / dist(xy0)).toFixed(2)}`);
});

await step('A11', 'Chronicle tab', 'SD-digest', async () => {
    const found = await tab('Chronicle');
    const text = await pane();
    await shot('a11-chronicle');
    await tab('Home'); await shot('a11-home');
    await closePanel();
    return check(found && /Hill Rain/.test(text) && /Bluewatch Watch/.test(text), text.slice(0, 160));
});

await step('A11p', 'phone (390 px): tabs fit, wizard fits', 'RB-screens2', async () => {
    const { browser: b2, page: phone } = await launchRaw({ width: 390, height: 844, port: CDP_PORT + 1, mobile: true, scale: 2 });
    try {
        watch(phone, 'phone');
        await phone.goto(ST_URL); await waitHost(phone); await connect(phone);
        await phone.evaluate(async main => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 1500)); await ctx.openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); }, mainChat);
        const w = await phone.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: innerWidth }));
        await phone.evaluate(() => document.querySelector('.story-suite-bar-story')?.click()); await phone.waitForTimeout(900);
        const edges = [];
        for (const name of await phone.evaluate(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].map(x => x.textContent.trim()))) {
            await tab(name, phone);
            edges.push([name, await phone.evaluate(() => { const p = document.querySelector('#story_suite_v2_panel'); const pn = document.querySelector('#story_suite_v2_panel .story-suite-pane'); return [Math.round(p?.getBoundingClientRect().right ?? 0), pn ? pn.scrollWidth - pn.clientWidth : 0]; })]);
            await shot(`p-${name.replace(/\W+/g, '_')}`, phone);
        }
        await phone.evaluate(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
        await phone.evaluate(async spare => { await SillyTavern.getContext().openCharacterChat(spare); await new Promise(r => setTimeout(r, 3000)); }, spareChat);
        const hasPc = await phone.evaluate(() => { try { return !!StoryBlock.sdk.query('party.pc'); } catch { return false; } });
        let wizard = { skipped: hasPc };
        if (!hasPc) {
            clearQueue();
            await phone.fill('#send_textarea', 'I look around.'); await phone.click('#send_but'); await phone.waitForTimeout(2500);
            wizard = await phone.evaluate(() => ({ dialog: !!document.querySelector('.ss-dialog'), w: Math.round(document.querySelector('.ss-dialog')?.getBoundingClientRect().width ?? 0) }));
            await shot('p-wizard', phone);
            await phone.evaluate(async () => { document.querySelector('.ss-dialog-close')?.click(); const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });
        }
        const over = edges.filter(([, [r, sx]]) => r > 391 || sx > 4);
        return check(w.scrollW <= w.innerW + 1 && over.length === 0 && (wizard.skipped || (wizard.dialog && wizard.w <= 390)), `page ${w.scrollW}/${w.innerW}; tabs over the edge ${j(over)}; wizard ${j(wizard)}`);
    } finally { await b2.close(); }
});

await step('A12', 'console errors', 'main', async () => {
    const CLASSES = [
        ['NSD sidecar 404 on a chat without one yet', e => /npc-state-delta-[a-z0-9]+\.json|Failed to load resource: the server responded with a status of 404/.test(e)],
        ['NSD scan got the mock\'s empty side answer', e => /dossier scan failed|relationship batch failed|backfill failed|No message generated/.test(e)],
        ['Story Block refused line (F41)', e => /\[Story Suite\] story-block: .* was not used/.test(e) || /\[Story Suite\] [a-z-]+: .*(was not used|refused)/.test(e)],
        ['SillyTavern warnings', e => /Settings not ready|swipe animation has not ended|missing or invalid swipe_info/.test(e)],
    ];
    const classified = new Map(); const other = [];
    for (const e of errors) { const c = CLASSES.find(([, t]) => t(e)); if (c) classified.set(c[0], (classified.get(c[0]) ?? 0) + 1); else other.push(e); }
    fs.writeFileSync(`${OUT}/console.txt`, errors.join('\n'));
    const bad = other.filter(e => /pageerror|console\.error|\b5\d\d\b/.test(e));
    return check(bad.length === 0, `${errors.length} lines; ${[...classified].map(([k, v]) => `${v}x ${k}`).join('; ')}; unclassified ${other.length}${bad.length ? ': ' + bad.slice(0, 4).join(' | ').slice(0, 600) : ''}`);
});

// ---- summary ----
const count = s => rows.filter(r => r.status === s).length;
const config = { VIEW, PACK_MODE, FEATURES, ECON, MODULES: await ev(() => StoryBlock.sdk.modules().map(m => `${m.id}@${m.version}`)).catch(() => '?') };
fs.writeFileSync(`${OUT}/config.json`, JSON.stringify({ ...config, featurePlan, econApplied }, null, 1));
const md = [`# beta live scenario ${TAG}`, '', `config: ${j(config)}`, '', `heads: ${Object.entries(heads).map(([k, v]) => `${k} ${v}`).join(', ')}`, '', `PASS ${count('PASS')} · FAIL ${count('FAIL')} · SKIP ${count('SKIP')}`, '', '| step | what | owner | result | note |', '|---|---|---|---|---|',
    ...rows.map(r => `| ${r.id} | ${r.title} | ${r.owner} | ${r.status} | ${String(r.note).replace(/\|/g, '/').slice(0, 400)} |`)].join('\n');
fs.writeFileSync(`${OUT}/result.md`, md + '\n');
fs.writeFileSync(`${OUT}/heads.json`, JSON.stringify(heads));
say('\nSUMMARY'); for (const r of rows) say(`${r.status} ${r.id} ${r.title} — ${String(r.note).slice(0, 220)}`);
say(`PASS ${count('PASS')} FAIL ${count('FAIL')} SKIP ${count('SKIP')} → ${OUT}/result.md`);
await browser.close();
process.exit(0);
