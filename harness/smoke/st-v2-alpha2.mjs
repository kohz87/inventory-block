// Story Suite v2 alpha.2 combined live test: Story Block c93d9b6, RPG Battle 924b9a3, Story Director 5b44f3b,
// NPC State Delta 676d30f (all origin/v2) in SillyTavern 1.19 with the mock model and the Ersveil pack.
// Adapted from st-v2int-combined2.mjs for the alpha.2 behaviour:
//   F95 no quest buttons: the reader's words take a quest, the story turns it in, code pays;
//   F80 checks use dice rolled before the reply (tail), code recomputes;
//   F96 story `! use`; SB VERSION 2.0.0-alpha.2 and every module declares `requires`.
// Usage: source inst-live2.env (ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG) then node st-v2-alpha2.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { sharedPrefix } from '/home/user/_live2/Story_block/testkit/fake-st.js';

const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const PACK = '/home/user/_live2/Story_block/examples/packs/ersveil-bluewatch/pack.json';
const { ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG } = process.env;
const OUT = `${SP}/alpha2`;
const SHOTS = `${OUT}/shots`;
fs.mkdirSync(SHOTS, { recursive: true });
const out = [];
const verdicts = [];
const say = (...a) => { const line = a.join(' '); out.push(line); console.log(`[${((Date.now() - (globalThis.T0s ?? Date.now())) / 1000).toFixed(0)}s] ${line}`); };
globalThis.T0s = Date.now();
const verdict = (step, ok, note = '') => { verdicts.push(`${ok ? 'PASS' : 'FAIL'} ${step}${note ? ` — ${note}` : ''}`); say(`>> ${ok ? 'PASS' : 'FAIL'} ${step}${note ? ` — ${note}` : ''}`); };
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

clearQueue();
REQ_BASE = Math.max(0, ...reqNames().map(n => Number(n.match(/\d+/)[0])));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const watch = (p, tag) => {
    p.on('pageerror', e => errors.push(`${tag} pageerror ${e.message}`));
    p.on('response', r => { if (r.status() >= 400) errors.push(`${tag} ${r.status()} ${r.url()}`); });
    p.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`${tag} console.${m.type()} ${m.text().slice(0, 300)}`); });
};
watch(page, 'desk');
const T0 = Date.now();
const withTimeout = (promise, ms, label) => Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))]);
const ev = (fn, a, ms = 90000) => withTimeout(page.evaluate(fn, a), ms, String(fn).slice(0, 80));
const shot = async (name, p = page) => { await p.screenshot({ path: `${SHOTS}/${name}.png` }); say(`   [shot] ${SHOTS}/${name}.png`); };
const waitHost = async p => {
    await p.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 120000 });
    await p.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 60000 }).catch(() => {});
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
async function reloadInto(chat) { await page.reload({ waitUntil: 'domcontentloaded' }); await waitHost(page); await connect(); await openChat(chat); }
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);

// ---- 0. Versions, requires, pack ----
const mods = await ev(() => StoryBlock.sdk.modules().map(m => ({ id: m.id, version: m.version, requires: m.requires ?? null })));
say('0. modules:', j(mods));
const sbVersion = await ev(async () => { try { return (await import('/scripts/extensions/third-party/Story_block/src/v2/registry.js')).HOST_VERSION ?? null; } catch { return null; } });
say('   StoryBlock.version:', j(await ev(() => ({ version: window.StoryBlock?.version ?? null, apiVersion: StoryBlock.apiVersion }))), 'registry HOST_VERSION:', j(sbVersion));
say('   drawer "needs Story Block" lines:', await ev(() => [...document.querySelectorAll('[class*="needs-story-block"]')].map(n => n.textContent).join(' | ') || 'none'));
const packText = fs.readFileSync(PACK, 'utf8');
const packRes = await ev(async packText => {
    const mod = await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js');
    const before = mod.packs.list().map(p => `${p.id}:${p.enabled}`);
    let install = null; let workaround = false;
    // Start from no pack, so the importer itself is tried every run.
    if (mod.packs.list().some(p => p.id === 'ersveil-bluewatch')) await mod.packs.remove('ersveil-bluewatch');
    {
        install = await mod.packs.install(packText, { source: 'file', origin: 'pack.json' });
        if (!install.ok) {
            // Product bug (see live-result): the live capability list misses Story Block's own domains, so a pack
            // that requires inventory/scene is refused. Store the entry as install() would, to test the rest.
            workaround = true;
            const raw = JSON.parse(packText);
            const es = SillyTavern.getContext().extensionSettings;
            es.storySuite ??= {}; es.storySuite.packs ??= [];
            es.storySuite.packs.push({ id: raw.id, version: raw.version, enabled: true, source: 'file', origin: 'pack.json', pack: raw });
            SillyTavern.getContext().saveSettingsDebounced();
            await new Promise(r => setTimeout(r, 2500));
        }
    }
    for (const p of mod.packs.list()) if (p.id !== 'ersveil-bluewatch' && p.enabled && mod.packs.setEnabled) await mod.packs.setEnabled(p.id, false);
    const caps = (await import('/scripts/extensions/third-party/Story_block/src/v2/packs/st-adapter.js')).stCapabilities();
    return { before, install: install && { ok: install.ok, errors: install.errors }, workaround, liveCapabilities: caps, after: mod.packs.list().map(p => `${p.id}:${p.enabled}:${JSON.stringify(p.counts)}:missing=${p.missing}`) };
}, packText);
say('   pack install:', j(packRes));
if (packRes.workaround) { await page.reload({ waitUntil: 'domcontentloaded' }); await waitHost(page); say('   after reload packs:', j(await ev(async () => (await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js')).packs.list().map(p => `${p.id}:${p.enabled}:missing=${p.missing}`)))); }
verdict('0 pack installs through Story Block\'s importer', !!packRes.install?.ok || (!packRes.install && !packRes.workaround), packRes.install?.ok === false ? `refused: ${packRes.install.errors?.[0]?.message} (live capabilities ${j(packRes.liveCapabilities)})` : 'installed');

await ev(async url => {
    const $ = window.jQuery;
    $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#custom_api_url_text').val(url).trigger('input');
    $('#custom_model_id').val('mock-model').trigger('input');
    $('#stream_toggle').prop('checked', false).trigger('change');
    $('#api_button_openai').trigger('click');
    await new Promise(r => setTimeout(r, 3000));
    const ctx = SillyTavern.getContext();
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
    await new Promise(r => setTimeout(r, 2000));
}, MOCK_URL);
// A spare chat (for the switch in step 6 and the phone wizard), then the main chat.
await ev(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 3000)); });
const spareChat = await ev(() => SillyTavern.getContext().getCurrentChatId());
await ev(async () => { await SillyTavern.getContext().executeSlashCommandsWithOptions('/newchat'); await new Promise(r => setTimeout(r, 3000)); });
const mainChat = await ev(() => SillyTavern.getContext().getCurrentChatId());
const headState = () => ev(() => StoryBlock.sdk.view().state);
say('   chats: spare', j(spareChat), 'main', j(mainChat));
say('   fresh chat:', j(await ev(() => { const s = StoryBlock.sdk.view().state; return { messages: SillyTavern.getContext().chat.length, domains: Object.keys(s?.domains ?? {}), place: s?.domains?.scene?.place?.name ?? s?.domains?.scene?.place, wallet: StoryBlock.sdk.query('inventory.wallet', {}), items: StoryBlock.sdk.query('inventory.items', {})?.map?.(i => `${i.name}×${i.qty}`) }; })));

async function send(text, reply, { wait = 20000 } = {}) {
    if (reply !== null) queue(reply);
    const before = await ev(() => SillyTavern.getContext().chat.length);
    const reqBefore = mainReqs().length;
    await page.fill('#send_textarea', text);
    await page.click('#send_but');
    await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes; }, before, { timeout: wait }).catch(() => {});
    await page.waitForTimeout(2500);
    const list = mainReqs();
    return list.length > reqBefore ? list.at(-1) : null;
}
const cmd = (type, payload) => ev(async ([t, p]) => { const r = await StoryBlock.sdk.command(t, p); return r.ok ? { ok: true, summary: r.receipt.summary, data: r.receipt.data } : { ok: false, code: r.code, message: r.message }; }, [type, payload]);
const q = (name, args) => ev(([n, a]) => { try { return StoryBlock.sdk.query(n, a); } catch (e) { return `ERR ${e.message}`; } }, [name, args]);
const lastReceipts = () => ev(() => { const m = SillyTavern.getContext().chat.at(-1); return (m.extra?.storySuite?.receipts ?? []).map(r => ({ type: r.type, module: r.module ?? r.owner ?? null, summary: r.summary, data: r.data })); });
const openPanel = async () => { if (!(await ev(() => { const p = document.querySelector('#story_suite_v2_panel'); return p && !p.hidden && getComputedStyle(p).display !== 'none'; }))) { await page.click('.story-suite-bar-story'); await page.waitForTimeout(800); } };
const closePanel = () => ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
const tab = async (name, p = page) => {
    const found = await p.evaluate(n => { const b = [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(x => x.textContent.trim().startsWith(n)); b?.click(); return !!b; }, name);
    await p.waitForTimeout(900);
    return found;
};
const pane = (p = page) => p.evaluate(() => (document.querySelector('#story_suite_v2_panel .story-suite-pane')?.innerText ?? '').replace(/\s+/g, ' ').trim());
const wallet = () => q('inventory.wallet', {});
const coinOf = w => (w && typeof w === 'object' ? Object.values(w).reduce((a, b) => a + (Number(b) || 0), 0) : 0);

// ---- 1. Generation held until a character exists; then the creation wizard ----
let before = reqNames().length;
await send('I step off the barge onto the Bluewatch quay.', 'This reply must never be used.', { wait: 6000 });
const blocked = await ev(() => ({
    messages: SillyTavern.getContext().chat.length,
    notice: document.querySelector('#story_suite_v2_bar .story-suite-notice')?.hidden === false ? document.querySelector('#story_suite_v2_bar .story-suite-notice-text')?.textContent : null,
    dialog: document.querySelector('.ss-dialog') ? `${document.querySelector('.ss-dialog-title')?.textContent} steps=${[...document.querySelectorAll('.ss-dialog-step')].map(n => n.textContent.trim()).join('/')}` : null,
}));
const sentWhileBlocked = reqNames().slice(before).filter(isMain).length;
say('1. blocked:', j(blocked), `main requests sent=${sentWhileBlocked}`, `queue left=${fs.readdirSync(MOCK_Q).length}`);
await shot('d01-blocked-wizard');
clearQueue();
// The wizard: start from the pack's ready-made character, walk the steps, Create.
const wiz = [];
const preset = await ev(() => { const b = document.querySelector('.ss-dialog .rpg-preset-go'); b?.click(); return b ? b.closest('[class*="preset"]')?.innerText?.replace(/\s+/g, ' ').slice(0, 160) : null; });
wiz.push(`preset: ${preset}`);
await page.waitForTimeout(600);
await shot('d02-wizard-preset');
for (let i = 0; i < 8; i += 1) {
    const st = await ev(() => ({ step: document.querySelector('.ss-dialog-step[aria-current], .ss-dialog-step.active, .ss-dialog-step[aria-selected="true"]')?.textContent?.trim() ?? null, next: !!document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])'), submit: !!document.querySelector('.ss-dialog-submit:not([hidden]), .ss-dialog .cc-go'), body: document.querySelector('.ss-dialog-body')?.innerText?.replace(/\s+/g, ' ').slice(0, 140) }));
    wiz.push(j(st));
    if (st.next) { await ev(() => document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])').click()); await page.waitForTimeout(500); continue; }
    break;
}
await shot('d03-wizard-last');
const created = await ev(async () => { const b = document.querySelector('.ss-dialog-submit:not([hidden])') ?? document.querySelector('.ss-dialog .cc-go'); b?.click(); await new Promise(r => setTimeout(r, 2500)); return { clicked: !!b, dialog: !!document.querySelector('.ss-dialog'), error: document.querySelector('.ss-dialog-error')?.textContent ?? null }; });
wiz.push(`create: ${j(created)}`);
say('   wizard:', wiz.join('\n     '));
let pc = await q('party.pc');
if (!pc) {
    say('   wizard did not create a character; falling back to creation.finish');
    say('   creation.finish:', j(await cmd('creation.finish', { name: 'Ren', preset: 'wessel-kit', race: 'human', talents: ['shadow-bent', 'river-born'], points: { STR: 0, VIT: 1, AGI: 2, DEX: 3, INT: 1, LUK: 1, CHA: 0 } })));
    pc = await q('party.pc');
}
say('   party.pc:', j(pc && { name: pc.name, level: pc.level, hp: pc.hp, stats: pc.stats, skills: (pc.skills ?? []).map(s => s.name ?? s.id ?? s) }));
// The held reader message stays in the chat; remove it so the next send is clean.
await ev(async () => { const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });
verdict('1 generation held until a character exists; creation wizard', !!blocked.notice && !!blocked.dialog && sentWhileBlocked === 0 && !!pc, `notice="${blocked.notice}", ${blocked.dialog}, requests while held=${sentWhileBlocked}, pc=${pc?.name}`);
await openPanel(); await tab('Party'); await shot('d04-party-after-creation'); await closePanel();

// ---- 2. Capture across all modules ----
const W0 = coinOf(await wallet());
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
const req1 = await send('I go into the Guild office and look at the board.', R1);
const rc1 = await lastReceipts();
// The draught is worth 2000 marks in the pack; one reply may give goods worth 800 (B-b3 budget): refused, and the
// reader should see the refused line under the reply (F41).
const noteText1 = await ev(() => [...([...document.querySelectorAll('#chat .mes')].at(-1)?.querySelectorAll('.story-suite-reply-note, [class*="refused"]') ?? [])].map(n => n.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
const card1 = await ev(() => ([...document.querySelectorAll('#chat .mes')].at(-1)?.innerText.match(/Changed this reply[^\n]*(\n[^\n]*)?/) ?? [null])[0]);
say('   card under reply 1:', j(card1), '| notes:', j(noteText1));
await shot('d04b-reply1-notes');
say('2. reply 1 receipts:', j(rc1.map(r => `${r.type}${r.data?.refused ? '(refused)' : ''}`)));
for (const r of rc1) say(`     ${r.type}: ${String(r.summary ?? '').slice(0, 160)}`);
const threads1 = await q('director.threads', {});
const list1 = Array.isArray(threads1) ? threads1 : Object.values(threads1 ?? {});
const quest1 = list1.find(t => t.kind === 'quest');
say('   quest thread:', j(quest1 && { key: quest1.key, offer: quest1.offer, taken: quest1.taken, fields: quest1.fields }));
say('   npc.meters Fenna:', j(await q('npc.meters', { name: 'Fenna' })));
say('   chronicle:', j({ events: (await q('chronicle.events', {}))?.map?.(e => `${e.name}:${e.state}`), factions: (await q('chronicle.factions', {}))?.map?.(f => f.name) }));
say('   clock:', j(await q('director.clock', {})), 'items:', j((await q('inventory.items', {}))?.map?.(i => `${i.name}×${i.qty}`)));
const kinds1 = new Set(rc1.map(r => r.type));
// ---- 3. Quest offer taken by the reader's words; fight; the story turns it in; code pays ----
const R2 = R('"Good," Fenna says, and hands you a stub of candle. Down in the granary cellar the sacks are moving: a swarm of rats pours out of the bins.', [
    '+ quest Granary Rats — Fenna wants the Watch granary cellar cleared | giver: Fenna | goal: Kill 6 cellar rats | reward: 50 marks',
    '! encounter 6 Cellar Rat — pouring out of the granary bins | tier: weak | stakes: normal',
]);
const req2 = await send('I\'ll take the rat job.', R2);
const rc2 = await lastReceipts();
say('3. reply 2 receipts:', j(rc2.map(r => r.type)));
for (const r of rc2) say(`     ${r.type}: ${String(r.summary ?? '').slice(0, 200)}`);
for (const r of rc2) kinds1.add(r.type);
const quest2 = await q('director.thread', { key: 'Granary Rats' });
say('   quest after the reader\'s words:', j(quest2 && { offer: quest2.offer, taken: !!quest2.taken, status: quest2.status }));
const offers = await q('combat.offers');
say('   combat offers:', j(offers));
const byModule = {
    'story-block': [...kinds1].filter(t => /capture\.(place|present|item|coin)/.test(t)),
    'story-director': [...kinds1].filter(t => /quest|world|faction|time|director|chronicle/.test(t)),
    'rpg-battle': [...kinds1].filter(t => /encounter|check|use|party|combat/.test(t)),
    'npc-state-delta': [...kinds1].filter(t => /npc/.test(t)),
};
say('   capture by module:', j(byModule));
verdict('2 capture across all modules', Object.values(byModule).every(v => v.length > 0), j(byModule));

await openPanel();
say('   tabs:', await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab-label')].map(n => n.textContent).join(', ')));
await tab('Quests');
const questsPane = await pane();
say('   Quests tab:', questsPane.slice(0, 320));
const questButtons = await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-pane button')].map(b => b.textContent.trim()).filter(Boolean));
say('   Quests tab buttons:', j(questButtons));
await shot('d05-quests-taken');
await tab('Fight');
say('   Fight tab:', (await pane()).slice(0, 240));
await shot('d06-fight-offer');
// Start a fight from the Fight tab's button; act with the board's Auto button; Finish.
async function fight(tag) {
    await openPanel(); await tab('Fight');
    const offersNow = await q('combat.offers');
    const started = await ev(() => { const b = document.querySelector('#story_suite_v2_panel [data-command="combat.start"]'); b?.click(); return !!b; });
    await page.waitForTimeout(1500);
    let session = await q('combat.session');
    if (!session) { say(`   ${tag} combat.start (command):`, j(await cmd('combat.start', { offer: offersNow?.[0]?.id }))); session = await q('combat.session'); }
    const startRc = await ev(() => SillyTavern.getContext().chat.flatMap(m => m.extra?.storySuite?.receipts ?? []).filter(r => r.type === 'combat.start').at(-1)?.summary);
    say(`   ${tag} started by the Fight button: ${started};`, startRc);
    await shot(`d07-${tag}-board`);
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
    await shot(`d08-${tag}-won`);
    const finishClicked = await ev(() => { const b = document.querySelector('.rpg-bb-finish'); b?.click(); return !!b; });
    await page.waitForTimeout(1500);
    if (!finishClicked || (await q('combat.session'))) say('   combat.end (command):', j(await cmd('combat.end', {})));
    say(`   ${tag}: status ${status} (Auto clicks ${clicks}, Finish clicked ${finishClicked});`, String((await q('combat.last'))?.summary ?? '').slice(0, 300));
    await closePanel();
    return status;
}
const status1 = await fight('fight1');
const prog1 = await q('quest.progress', { key: 'Granary Rats' });
say('   quest.progress:', j(prog1));
let early = null;
let status2 = 'not needed';
if (!prog1?.met) {
    // A turn-in too early (the weak offer fielded fewer than six; the rest hung back): refused and told.
    const R3a = R('Fenna counts the tails into a tin. "That few? The bins are still squeaking."', ['- quest Granary Rats — turned in to Fenna']);
    await send('I bring Fenna the rat tails.', R3a);
    early = (await lastReceipts()).find(r => /Granary Rats/.test(r.summary ?? ''));
    say('   early turn-in:', j(early?.summary), 'wallet', coinOf(await wallet()));
    const R3b = R('Back in the cellar the last of the swarm comes squealing out from under the sacks.', [`! encounter ${prog1.need - prog1.have} Cellar Rat — the rest of the swarm under the sacks | tier: weak | stakes: normal`]);
    await send('I go back down for the rest of them.', R3b);
    status2 = await fight('fight2');
    say('   foesBeaten:', j(await q('combat.foesBeaten', { sinceRev: 0 })));
    say('   quest.progress:', j(await q('quest.progress', { key: 'Granary Rats' })));
}
await openPanel(); await tab('Quests'); say('   Quests tab before the turn-in:', (await pane()).slice(0, 260)); await shot('d08b-quests-ready'); await closePanel();
const session = await q('combat.session');
const W1 = coinOf(await wallet());
const R3 = R('Fenna counts the rat tails into a tin, wrinkles her nose and pays out of the Watch purse.', ['- quest Granary Rats — turned in to Fenna']);
const req3 = await send('All six are dead. Here are the tails, Fenna.', R3);
const rc3 = await lastReceipts();
for (const r of rc3) say(`   turn-in reply ${r.type}: ${String(r.summary ?? '').slice(0, 220)}`);
const W2 = coinOf(await wallet());
const turnIn = rc3.find(r => /turns in Granary Rats/.test(r.summary ?? ''));
say('   wallet before fights / before turn-in / after turn-in:', W0, W1, W2);
const quest3 = await q('director.thread', { key: 'Granary Rats' });
say('   quest now:', j(quest3 && { status: quest3.status, ended: quest3.ended }));
// The next reply is told (the [Happened] lines in its tail).
const req4 = await send('I ask Fenna where I can get a hot meal.', R('Fenna points across the lane at the Stray Oar.'));
const tail4 = tailOf(req(req4));
const told = /\[Happened\][\s\S]*turns in Granary Rats/.test(tail4);
say(`   ${req4} [Happened]:`, j((tail4.match(/\[Happened\][\s\S]{0,500}/) ?? [''])[0]));
await openPanel(); await tab('Quests'); say('   Quests tab after turn-in:', (await pane()).slice(0, 260)); await shot('d09-quests-finished'); await closePanel();
verdict('3 quest taken by words, fight, story turn-in paid by code, next reply told', !!quest2?.taken && status1 === 'won' && (prog1?.met || (status2 === 'won' && /stays open/.test(early?.summary ?? ''))) && !!turnIn && W2 > W1 && told && questButtons.every(b => !/^(take|accept|finish|turn down|abandon|decline)/i.test(b)),
    `taken by words=${!!quest2?.taken}; fight 1 ${status1} (${prog1?.label})${prog1?.met ? '' : `, early turn-in refused: "${early?.summary}", fight 2 ${status2}`}; receipt "${turnIn?.summary ?? 'none'}"; wallet ${W1}→${W2}; told next reply=${told}; quest buttons=${j(questButtons)}`);

// ---- 4. A check with dice rolled before the reply ----
const R5 = R('You get a boot on the wet palisade, find the iron cleat, and haul yourself up, tearing a knuckle on the way. From the walkway the east bluff is a grey shoulder in the mist.', ['? check climb — climbing the wet palisade for a look at the bluff | dc: normal | roll: 1 | result: success', `~ wound ${pc?.name ?? 'Ren'} — tore a knuckle on the palisade cleat | harm: wound`]);
const req5 = await send('I climb the wet palisade to get a look at the east bluff.', R5);
const tail5 = tailOf(req(req5));
const diceLine = (tail5.match(/Dice for this reply:[^\n]*/) ?? [null])[0];
const modTable = (tail5.match(/Check modifiers[^\n]*/) ?? [null])[0];
const rc5 = await lastReceipts();
const checkRc = rc5.find(r => r.type === 'capture.check');
const logLast = (await q('checks.log', {}))?.at?.(-1);
const card = await ev(() => [...document.querySelectorAll('#chat .mes')].at(-1)?.querySelector('[class*="status"], [class*="card"]')?.innerText?.replace(/\s+/g, ' ').slice(0, 300) ?? null);
say(`4. ${req5} tail:`, j(diceLine));
say('   modifier table:', j(modTable));
say('   check receipt:', j(checkRc?.summary), '| log entry:', j(logLast && { die: logLast.die, mod: logLast.mod, total: logLast.total, dc: logLast.dc, outcome: logLast.outcome, said: logLast.said, mismatch: logLast.mismatch ?? '' }));
say('   other receipts:', j(rc5.filter(r => r.type !== 'capture.check').map(r => `${r.type}: ${String(r.summary).slice(0, 120)}`)));
say('   card under the reply:', j(card));
const roll1 = Number((diceLine ?? '').match(/Roll 1\D*(\d+)/)?.[1]);
await ev(() => { const c = document.querySelector('#chat'); if (c) c.scrollTop = c.scrollHeight; });
await shot('d10-check-card');
const expected = logLast ? (logLast.die === 20 ? 'success' : logLast.die === 1 ? 'fail' : logLast.total >= logLast.dc ? 'success' : logLast.total >= logLast.dc - 2 ? 'cost' : 'fail') : null;
verdict('4 check with pre-rolled dice', !!diceLine && !!logLast && logLast.die === roll1 && logLast.outcome === expected && (logLast.said === logLast.outcome || !!logLast.mismatch),
    `tail "${diceLine}"; code recorded die ${logLast?.die} ${logLast?.mod >= 0 ? '+' : ''}${logLast?.mod} = ${logLast?.total} vs dc ${logLast?.dc} → ${logLast?.outcome} (story said ${logLast?.said}${logLast?.mismatch ? `, flagged: ${logLast.mismatch}` : ''})`);

// ---- 5. A story item use ----
const countOf = (list, re) => (list ?? []).filter(i => re.test(i.name)).reduce((a, i) => a + i.qty, 0);
const salveBefore = countOf(await q('inventory.items', {}), /Healing Salve/);
const hpBefore = (await q('party.pc'))?.hp;
const R6 = R('You open the salve Fenna gave you and work it into the torn knuckle; the sting fades.', [`! use Healing Salve | on: ${pc?.name ?? 'Ren'}`]);
await send('I put some of the healing salve on my hand.', R6);
const rc6 = await lastReceipts();
const salveAfter = countOf(await q('inventory.items', {}), /Healing Salve/);
const hpAfter = (await q('party.pc'))?.hp;
for (const r of rc6.filter(x => !/prepare|settle/.test(x.type))) say(`5. reply ${r.type}: ${String(r.summary ?? '').slice(0, 200)}${r.data?.refused ? ' [refused]' : ''}`);
say('   salves', salveBefore, '→', salveAfter, 'HP', j(hpBefore), '→', j(hpAfter));
const useRc = rc6.find(r => r.type === 'capture.use');
verdict('5 story item use', !!useRc && !useRc.data?.refused && salveAfter === salveBefore - 1 && hpAfter?.cur > hpBefore?.cur, `${useRc?.summary ?? 'no use receipt'}; salves ${salveBefore}→${salveAfter}, HP ${hpBefore?.cur}→${hpAfter?.cur}`);

// ---- 6. A chat switch right after a UI command; nothing is lost ----
const blade = ((await q('inventory.items', {})) ?? []).find(i => /Cane-Blade/.test(i.name));
const gearBefore = (await q('items.gear', {}))?.counted;
const switchRes = await ev(async ([stack, spare]) => {
    const ctx = SillyTavern.getContext();
    const p = StoryBlock.sdk.command('item.equip', { stack });
    const switching = ctx.openCharacterChat(spare);       // no await between the click and the switch
    const r = await p;
    await switching;
    await new Promise(res => setTimeout(res, 2500));
    return { ok: r.ok, code: r.code ?? null, summary: r.receipt?.summary ?? r.message, now: ctx.getCurrentChatId(), spareMessages: SillyTavern.getContext().chat.length, spareRecord: SillyTavern.getContext().chat.some(m => (m.extra?.storySuite?.receipts ?? []).some(x => x.type === 'item.equip')) };
}, [blade?.stack ?? blade?.id, spareChat]);
say('6. equip Cane-Blade + immediate switch:', j(switchRes));
await ev(async main => { await SillyTavern.getContext().openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); }, mainChat);
const afterSwitch = await ev(() => { const c = SillyTavern.getContext(); return { chat: c.getCurrentChatId(), equipReceipt: c.chat.some(m => (m.extra?.storySuite?.receipts ?? []).some(x => x.type === 'item.equip')) }; });
const gearAfter = (await q('items.gear', {}))?.counted;
say('   back in main:', j(afterSwitch), 'gear counted before:', j(gearBefore), 'after:', j(gearAfter));
await reloadInto(mainChat);
const afterReload = await ev(() => { const c = SillyTavern.getContext(); return { chat: c.getCurrentChatId(), equipReceipt: c.chat.some(m => (m.extra?.storySuite?.receipts ?? []).some(x => x.type === 'item.equip')), rev: StoryBlock.sdk.view().state?.meta?.rev }; });
say('   after reload:', j(afterReload), 'gear counted:', j((await q('items.gear', {}))?.counted));
verdict('6 chat switch right after a UI command; nothing lost', switchRes.ok && afterSwitch.equipReceipt && afterReload.equipReceipt && !switchRes.spareRecord, `command ${switchRes.ok ? `ok ("${switchRes.summary}")` : switchRes.code}, receipt in main after switch=${afterSwitch.equipReceipt}, after reload=${afterReload.equipReceipt}, leaked into spare=${switchRes.spareRecord}`);
await ev(() => window.scrollTo(0, 0));

// ---- 7. Swipe, delete-middle and rewind ----
const stateJSON = s => JSON.stringify({ domains: s?.domains });
const invNames = () => q('inventory.items', {}).then(l => (l ?? []).map(i => `${i.name}×${i.qty}`).sort());
await send('I buy a torch at the Watch Stores.', R('The quartermaster hands over a torch.', ['+ item Torch | qty: 1']));
const swA = await invNames();
clearQueue(); queue(R('The quartermaster is out of torches; he gives you a coil of rope instead.', ['+ item Hemp Rope | qty: 1']));
await page.locator('#chat .mes').last().locator('.swipe_right').click();
await page.waitForFunction(() => { const m = SillyTavern.getContext().chat.at(-1); return m.swipes?.length >= 2 && m.mes && /rope/.test(m.mes); }, null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2500);
const swB = await invNames();
await page.locator('#chat .mes').last().locator('.swipe_left').click();
await page.waitForTimeout(3000);
const swBack = await invNames();
const swipeOk = swA.some(x => /^Torch/.test(x)) && !swA.some(x => /^Hemp Rope/.test(x)) && swB.some(x => /^Hemp Rope/.test(x)) && !swB.some(x => /^Torch/.test(x)) && j(swBack) === j(swA);
say('7. swipe: A', j(swA.filter(x => /Torch|Rope/.test(x))), 'B', j(swB.filter(x => /Torch|Rope/.test(x))), 'back to A', j(swBack.filter(x => /Torch|Rope/.test(x))));
// Delete in the middle: the check reply (and its reader message). Later replies keep their changes; the
// live head must equal a rebuild from the saved file (page reload).
const chatIdx = await ev(() => SillyTavern.getContext().chat.map((m, i) => ({ i, user: m.is_user, mes: m.mes.slice(0, 40) })));
const checkIdx = (await ev(() => SillyTavern.getContext().chat.findIndex(m => !m.is_user && /palisade/.test(m.mes))));
const checksBefore = (await q('checks.log', {}))?.length ?? null;
const walletBeforeDel = await wallet();
await ev(async i => { const c = SillyTavern.getContext(); await c.deleteMessage(i); await c.deleteMessage(i - 1); await c.saveChat(); }, checkIdx);
await page.waitForTimeout(2500);
const liveAfterDel = await headState();
const checksAfter = (await q('checks.log', {}))?.length ?? null;
const walletAfterDel = await wallet();
const questAfterDel = await q('director.thread', { key: 'Granary Rats' });
await reloadInto(mainChat);
const rebuilt = await headState();
const sameAsRebuild = stateJSON(liveAfterDel) === stateJSON(rebuilt);
say('   delete middle (check reply at', checkIdx, '): checks log', checksBefore, '→', checksAfter, 'wallet', j(walletBeforeDel), '→', j(walletAfterDel), 'quest', questAfterDel?.status, '| live == rebuild after reload:', sameAsRebuild);
if (!sameAsRebuild) {
    const a = liveAfterDel?.domains ?? {}; const b = rebuilt?.domains ?? {};
    say('   differing domains:', j(Object.keys({ ...a, ...b }).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))));
}
// Rewind: back to just before the turn-in on the turn-in reply (a branch); the main chat stays as it was.
const turnInIdx = await ev(() => SillyTavern.getContext().chat.findIndex(m => !m.is_user && (m.extra?.storySuite?.receipts ?? []).some(r => /turns in Granary Rats/.test(r.summary ?? ''))));
const turnInRev = await ev(i => { const r = SillyTavern.getContext().chat[i].extra.storySuite.receipts; return Math.min(...r.filter(x => /turns in Granary Rats/.test(x.summary ?? '')).map(x => x.rev)); }, turnInIdx);
const preRewind = { chat: await ev(() => SillyTavern.getContext().getCurrentChatId()), wallet: coinOf(await wallet()), messages: await ev(() => SillyTavern.getContext().chat.length) };
const rw = await ev(async ([index, beforeRev]) => { const r = await StoryBlock.sdk.rewind({ index, beforeRev }); await new Promise(res => setTimeout(res, 3000)); return r; }, [turnInIdx, turnInRev]);
const onBranch = { chat: await ev(() => SillyTavern.getContext().getCurrentChatId()), wallet: coinOf(await wallet()), messages: await ev(() => SillyTavern.getContext().chat.length), quest: (await q('director.thread', { key: 'Granary Rats' }))?.status };
await ev(async main => { await SillyTavern.getContext().openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); }, mainChat);
const backMain = { chat: await ev(() => SillyTavern.getContext().getCurrentChatId()), wallet: coinOf(await wallet()), messages: await ev(() => SillyTavern.getContext().chat.length) };
say('   rewind to index', turnInIdx, 'before rev', turnInRev, ':', j({ ok: rw.ok, code: rw.code, message: rw.message, branch: rw.branch, dropped: rw.dropped?.length ?? rw.dropped }));
say('   before:', j(preRewind), 'branch:', j(onBranch), 'main again:', j(backMain));
const rewindOk = rw.ok && W2 - W1 === 50 && onBranch.wallet === preRewind.wallet - 50 && onBranch.quest !== 'resolved' && backMain.wallet === preRewind.wallet && backMain.messages === preRewind.messages;
verdict('7 swipe, delete-middle, rewind', swipeOk && checksAfter === (checksBefore ?? 0) - 1 && sameAsRebuild && rewindOk,
    `swipe ${swipeOk ? 'follows' : 'WRONG'}; delete-middle checks ${checksBefore}→${checksAfter}, live==rebuild ${sameAsRebuild}; rewind ${rw.ok ? `branch wallet ${onBranch.wallet} (was ${preRewind.wallet}), quest ${onBranch.quest}, main kept ${backMain.wallet}` : rw.code + ' ' + rw.message}`);

// ---- 8. Static prompt byte identity and the shared prefix ----
const mains = mainReqs();
const statics = mains.map(n => staticOf(req(n)));
const distinct = [...new Set(statics)];
const prefixes = [];
for (let i = 1; i < mains.length; i += 1) prefixes.push(sharedPrefix(req(mains[i - 1]).messages, req(mains[i]).messages).percent);
say(`8. main requests: ${mains.length}; distinct static parts: ${distinct.length}; static length ${statics[0]?.length}`);
if (distinct.length > 1) {
    const a = distinct[0], b = distinct[1]; let k = 0; while (k < a.length && a[k] === b[k]) k += 1;
    say('   first static difference at', k, j(a.slice(Math.max(0, k - 80), k + 120)), 'vs', j(b.slice(Math.max(0, k - 80), k + 120)));
}
say('   shared prefix % between consecutive main requests:', j(prefixes));
const pRepr = sharedPrefix(req(req4).messages, req(req5).messages);
say(`   shared prefix ${req4} vs ${req5}: ${pRepr.chars} chars, ${pRepr.percent}%`);
fs.writeFileSync(`${OUT}/static-part.txt`, statics[0] ?? '');
fs.writeFileSync(`${OUT}/tail-${req5}.txt`, tail5);
verdict('8 static prompt byte-identical; shared prefix', distinct.length === 1, `${mains.length} requests, ${distinct.length} distinct static part(s), prefix median ${prefixes.slice().sort((a, b) => a - b)[Math.floor(prefixes.length / 2)]}% (min ${Math.min(...prefixes)}%)`);

// ---- 9. NSD hosted Cast tab; other tabs not clobbered ----
await openPanel();
await tab('Cast');
let castText = await pane();
const castBefore = castText;
let manualAdd = null;
if (!/Fenna/.test(castText)) {
    // The mock answers NSD's own dossier scans with nothing, so no dossier exists yet. Make Fenna's the way a reader
    // can: NPC State Delta's "add an NPC" (its prompt asks for the name).
    page.once('dialog', d => d.accept('Fenna'));
    manualAdd = await ev(async () => { await window.NPCStateDelta?.addNpc?.(); await new Promise(r => setTimeout(r, 1500)); return !!window.NPCStateDelta?.addNpc; });
    await tab('Quests'); await tab('Cast');
    castText = await pane();
}
say('9. Cast tab before a dossier:', castBefore.slice(0, 160), '| manual add:', manualAdd);
const npcCard = await ev(() => [...document.querySelectorAll('#chat .mes')].map(m => [...m.querySelectorAll('[class*="npc"], [class*="meter"]')].map(n => n.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' / ')).filter(Boolean).slice(-2));
say('   NPC meter cards under replies:', j(npcCard).slice(0, 400));
const castMeters = await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .npc-state-delta-v2-meter-npc')].map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 120)));
say('   Cast tab:', castText.slice(0, 300));
say('   Cast meters:', j(castMeters));
await shot('d11-cast');
await tab('Quests');
const questsBeforeNsd = await pane();
await ev(() => { document.dispatchEvent(new CustomEvent('npc-state-delta:cast-rendered')); document.dispatchEvent(new CustomEvent('npc-state-delta:enabled-changed')); });
await page.waitForTimeout(800);
const questsAfterEvent = await pane();
await closePanel();
await send('I wave to Fenna on my way out.', R('Fenna waves back with her quill.', ['~ npc Fenna | affection: +5']));
await openPanel(); await tab('Quests');
await ev(() => document.dispatchEvent(new CustomEvent('npc-state-delta:cast-rendered')));
await page.waitForTimeout(800);
const questsAfterReply = await pane();
const hostedFlag = await ev(() => ({ flag: Object.keys(document.documentElement.dataset).filter(k => /npc|hosted|delta/i.test(k)), launcherVisible: [...document.querySelectorAll('[id*="npc_state_delta"][id*="launcher"], .npc-state-delta-launcher')].some(n => n.offsetParent !== null) }));
say('   Quests pane kept after NSD events:', questsAfterEvent === questsBeforeNsd, '| after a reply + event still Quests:', /Granary Rats|Quest/i.test(questsAfterReply) && !/METERS/.test(questsAfterReply), '| hosted:', j(hostedFlag));
verdict('9 NSD hosted Cast tab; other tabs not clobbered', /Fenna/.test(castText) && questsAfterEvent === questsBeforeNsd && !/METERS|NPC State Delta/.test(questsAfterReply), `Cast shows Fenna=${/Fenna/.test(castText)}, meters=${castMeters.length}, Quests kept=${questsAfterEvent === questsBeforeNsd}`);

// ---- 10. The map: search and zoom ----
const mapFound = await tab('Map');
await page.waitForTimeout(800);
const placeXY = () => ev(() => [...document.querySelectorAll('.sd-map .sd-map-place')].slice(0, 2).map(n => { const r = n.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; }));
const mapInfo = await ev(() => ({ places: document.querySelectorAll('.sd-map .sd-map-place').length, here: !!document.querySelector('.sd-map .sd-map-here'), empty: document.querySelector('.sd-map .sd-map-empty')?.hidden === false }));
await shot('d12-map');
await page.fill('.sd-map .sd-map-search input', 'grnary');
await page.waitForTimeout(700);
const results = await ev(() => [...document.querySelectorAll('.sd-map .sd-map-results li')].map(n => n.textContent.trim()).slice(0, 5));
await shot('d13-map-search');
await ev(() => document.querySelector('.sd-map .sd-map-results li button, .sd-map .sd-map-results li')?.click());
await page.waitForTimeout(800);
const details = await ev(() => document.querySelector('.sd-map .sd-map-details:not([hidden])')?.innerText?.replace(/\s+/g, ' ').slice(0, 200) ?? null);
await ev(() => document.querySelector('.sd-map .sd-map-fit')?.click()); await page.waitForTimeout(500);
const xy0 = await placeXY();
await ev(() => document.querySelector('.sd-map .sd-map-zoom-in')?.click()); await page.waitForTimeout(400);
await ev(() => document.querySelector('.sd-map .sd-map-zoom-in')?.click()); await page.waitForTimeout(600);
const xy1 = await placeXY();
const dist = xy => (xy.length === 2 ? Math.hypot(xy[0][0] - xy[1][0], xy[0][1] - xy[1][1]) : NaN);
await shot('d14-map-zoomed');
say('10. map:', j({ tab: mapFound, ...mapInfo }), 'search "grnary":', j(results), 'details:', j(details), `zoom: distance ${dist(xy0).toFixed(1)} → ${dist(xy1).toFixed(1)}`);
verdict('10 map: search and zoom', mapInfo.places > 0 && results.some(r => /Granary/i.test(r)) && dist(xy1) > dist(xy0) * 1.2, `${mapInfo.places} places, search found ${j(results.slice(0, 2))}, zoom ×${(dist(xy1) / dist(xy0)).toFixed(2)}`);

// ---- 11. The Chronicle tab ----
const chronFound = await tab('Chronicle');
const chronText = await pane();
say('11. Chronicle tab:', chronFound, chronText.slice(0, 300));
await shot('d15-chronicle');
verdict('11 Chronicle tab', chronFound && /Hill Rain/.test(chronText) && /Bluewatch Watch/.test(chronText), chronText.slice(0, 120));
await tab('Inventory'); await shot('d16-inventory');
await tab('Home'); await shot('d17-home');
await closePanel();
await ev(() => { const c = document.querySelector('#chat'); if (c) c.scrollTop = c.scrollHeight; });
await shot('d18-chat');

// ---- Phone (390) ----
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
watch(phone, 'phone');
await phone.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(phone);
await connect(phone);
await phone.evaluate(async main => { const ctx = SillyTavern.getContext(); if (ctx.getCurrentChatId() !== main) { await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator'))); await new Promise(r => setTimeout(r, 1500)); await ctx.openCharacterChat(main); await new Promise(r => setTimeout(r, 3000)); } }, mainChat);
await phone.evaluate(() => { const c = document.querySelector('#chat'); if (c) c.scrollTop = c.scrollHeight; });
await shot('p01-chat', phone);
const phoneW = await phone.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: innerWidth }));
await phone.tap('.story-suite-bar-story'); await phone.waitForTimeout(900);
for (const [name, file] of [['Quests', 'p02-quests'], ['Fight', 'p03-fight'], ['Cast', 'p04-cast'], ['Map', 'p05-map'], ['Chronicle', 'p06-chronicle'], ['Party', 'p07-party']]) {
    await tab(name, phone);
    const over = await phone.evaluate(() => { const p = document.querySelector('#story_suite_v2_panel'); return p ? Math.round(p.getBoundingClientRect().right) : null; });
    say(`   phone ${name}: panel right edge ${over}px`);
    await shot(file, phone);
}
await phone.evaluate(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
// The wizard on a phone: the spare chat has no character yet.
await phone.evaluate(async spare => { await SillyTavern.getContext().openCharacterChat(spare); await new Promise(r => setTimeout(r, 3000)); }, spareChat);
clearQueue();
await phone.fill('#send_textarea', 'I look around.');
await phone.tap('#send_but');
await phone.waitForTimeout(2500);
const phoneWizard = await phone.evaluate(() => ({ dialog: !!document.querySelector('.ss-dialog'), w: Math.round(document.querySelector('.ss-dialog')?.getBoundingClientRect().width ?? 0) }));
await shot('p08-wizard', phone);
say('   phone: page width', j(phoneW), 'wizard', j(phoneWizard));
await phone.evaluate(async () => { document.querySelector('.ss-dialog-close')?.click(); const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });
await phone.close();

// ---- 12. Console errors ----
const CLASSES = [
    ['NSD sidecar 404 on a chat without one yet (one look per chat per page load; known, harmless)', e => /npc-state-delta-[a-z0-9]+\.json|Failed to load resource: the server responded with a status of 404/.test(e)],
    ['NSD dossier scan got no answer (the mock answers only story requests: test setup)', e => /dossier scan failed|relationship batch failed|backfill failed|No message generated/.test(e)],
    ['Story Block refused line (by design, F41: shown on the reply card)', e => /\[Story Suite\] story-block: .* was not used/.test(e)],
    ['SillyTavern warnings (settings save timing, swipe animation)', e => /Settings not ready|swipe animation has not ended/.test(e)],
    ['SillyTavern backfilled swipe_info after a swipe (warning; see report)', e => /missing or invalid swipe_info/.test(e)],
];
const classified = new Map();
const other = [];
for (const e of errors) { const c = CLASSES.find(([, t]) => t(e)); if (c) classified.set(c[0], (classified.get(c[0]) ?? 0) + 1); else other.push(e); }
say('12. page errors/warnings:', errors.length ? `\n  ${errors.slice(0, 60).join('\n  ')}` : 'none');
say('   by class:', j(Object.fromEntries(classified)), 'unclassified:', other.length);
verdict('12 console errors', !other.some(e => /pageerror|console\.error|\b5\d\d\b/.test(e)), `${errors.length} lines; ${[...classified].map(([k, v]) => `${v}x ${k}`).join('; ')}; unclassified ${other.length}${other.length ? ': ' + other.slice(0, 3).join(' | ') : ''}`);

say('\nSUMMARY');
for (const v of verdicts) say(v);
fs.writeFileSync(`${OUT}/live-result.txt`, out.join('\n') + '\n');
await browser.close();
