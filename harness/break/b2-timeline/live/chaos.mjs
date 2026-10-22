// b2-timeline live chaos: the real UI of SillyTavern 1.19 + all four extensions + the mock model.
// usage: node chaos.mjs <seed> <steps>
// After every step (page idle + settle): #1 page head == replay of the page's chat, #7 replay of the
// chat file == page head, #2 a reply shown again has the state it had. Console errors and stuck
// generations are recorded.
import fs from 'node:fs';
import { launch, openPage, openNarrator, queue, clearQueue, chatId, cmd, pageHead, liveChat, fileChat, headOf, idle, sendText, sleep, J, SP, MOCK_LOG, setStream } from './lib.mjs';
const B = process.env.B2ROOT ?? '/home/user/_break/b2-timeline';
const { prng } = await import(`${B}/Story_block/tests/v2/qa/helpers/seeded.js`);

const SEED = Number(process.argv[2] ?? 1), STEPS = Number(process.argv[3] ?? 300);
const r = prng(SEED);
const OUT = `${SP}/break/b2-timeline/live/out-${SEED}`;
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const findings = [];
const log = [];
const note = (what, detail = '') => { const f = { step: log.length - 1, op: log.at(-1), what, detail: String(detail).slice(0, 500) }; findings.push(f); console.log('  !!', JSON.stringify(f)); };

const browser = await launch();
let page = await openPage(browser, { errors });
clearQueue();
await openNarrator(page);
let main = await chatId(page);
const scratch = [];
console.log('chat', main);
await cmd(page, 'party.create', { name: 'Ren', preset: 'fighter' });
await cmd(page, 'scene.place', { name: 'Bluewatch Village', kind: 'settlement' });

const ITEMS = ['Rope', 'Lamp', 'Iron Key', 'Apple', 'Torch'];
const PEOPLE = ['Fenna', 'Kael', 'Lyra'];
function line() {
    switch (r.int(0, 9)) {
        case 0: case 1: return `+ item ${r.pick(ITEMS)} | qty: ${r.int(1, 3)}`;
        case 2: return `- item ${r.pick(ITEMS)} | qty: 1`;
        case 3: return `+ coin ${r.int(1, 30)} | from: ${r.pick(PEOPLE)}`;
        case 4: return `- coin ${r.int(1, 12)} | to: ${r.pick(PEOPLE)}`;
        case 5: return `${r.pick(['+', '-'])} present ${r.pick(PEOPLE)}`;
        case 6: return `+ quest Find ${r.pick(ITEMS)} — a job | giver: ${r.pick(PEOPLE)} | goal: get it | reward: 10 coin`;
        case 7: return `! time +${r.int(1, 5)}h`;
        case 8: return `~ wound Ren — a fall | harm: scratch`;
        default: return `+ hook Rumor ${r.int(1, 9)} — an open thread`;
    }
}
let rn = 0;
const reply = (long = false) => {
    const tok = `[R${++rn}]`;
    const pad = long ? ` ${'The rain keeps falling on the roofs of the village. '.repeat(r.int(40, 90))}` : '';
    const lines = Array.from({ length: r.int(0, 4) }, line);
    return { tok, text: `${tok} The story goes on.${pad}${lines.length ? `\n<Changes>\n${lines.join('\n')}\n</Changes>` : ''}` };
};
const tokOf = mes => (/\[R\d+\]/.exec(String(mes ?? '')) ?? [null])[0];
const recorded = new Map();   // `${chat}|${tok}` -> head JSON
let stream = false;

async function ensureChat(id) {
    if ((await chatId(page)) !== id) await page.evaluate(async c => { await SillyTavern.getContext().openCharacterChat(c); }, id);
    await sleep(800);
}
async function reloadPage(p = page) {
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
    await p.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 30000 }).catch(() => {});
    await sleep(800);
    await p.evaluate(async () => { window.jQuery('#api_button_openai').trigger('click'); await new Promise(r => setTimeout(r, 1500)); });
    await p.evaluate(async () => {
        const ctx = SillyTavern.getContext();
        const id = ctx.characters.findIndex(c => c.name === 'The Narrator');
        if (String(ctx.characterId) !== String(id)) await ctx.selectCharacterById(String(id));
    });
    await sleep(1200);
}
const slash = (text, p = page) => p.evaluate(async t => { try { await SillyTavern.getContext().executeSlashCommandsWithOptions(t); return true; } catch (e) { return e.message; } }, text);
const isGen = (p = page) => p.evaluate(() => getComputedStyle(document.querySelector('#mes_stop')).display !== 'none').catch(() => false);
async function waitGenStart(p = page, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await isGen(p)) return true; await sleep(50); } return false; }
const lastIsCarrier = () => page.evaluate(() => { const c = SillyTavern.getContext().chat; return c.length > 1 && !c.at(-1).is_user; });

const OPS = {
    async send() { clearQueue(); const rp = reply(r.chance(0.2)); queue(rp.text); await sendText(page, `I act ${log.length}.`); },
    async swipeRight() { if (!(await lastIsCarrier())) return; clearQueue(); queue(reply().text); await page.locator('#chat .mes').last().locator('.swipe_right').click({ timeout: 3000 }).catch(e => note('swipe_right click failed', e.message)); },
    async swipeLeft() { if (!(await lastIsCarrier())) return 'restore'; await page.locator('#chat .mes').last().locator('.swipe_left').click({ timeout: 3000 }).catch(() => {}); return 'restore'; },
    async regenerate() { clearQueue(); queue(reply().text); await slash('/regenerate'); },
    async cont() { if (!(await lastIsCarrier())) return; clearQueue(); queue(r.chance(0.5) ? ` More.\n<Changes>\n${line()}\n</Changes>` : ' More.'); await slash('/continue'); },
    async deleteLast() { if ((await page.evaluate(() => SillyTavern.getContext().chat.length)) <= 1) return; await slash('/del 1'); return 'restore'; },
    async deleteMiddle() {
        const n = await page.evaluate(() => SillyTavern.getContext().chat.length);
        if (n < 5) return;
        const i = r.int(1, n - 2);
        await page.evaluate(async i => { await SillyTavern.getContext().deleteMessage(i); }, i);
        return 'changed';
    },
    async deleteSwipe() {
        const ok = await page.evaluate(async () => { const c = SillyTavern.getContext(); const m = c.chat.at(-1); if (m.is_user || !(m.swipes?.length > 1)) return false; await c.deleteMessage(c.chat.length - 1, m.swipe_id); return true; });
        return ok ? 'changed-last' : undefined;
    },
    async edit() {
        const n = await page.evaluate(() => SillyTavern.getContext().chat.length);
        if (n < 2) return;
        const i = r.int(0, n - 1);
        const mes = page.locator(`#chat .mes[mesid="${i}"]`);
        await mes.locator('.mes_edit').click({ timeout: 3000 }).catch(() => {});
        const ta = page.locator('#chat .edit_textarea');
        if (!(await ta.count())) return;
        const old = await ta.inputValue();
        await ta.fill(`${old}\n<Changes>\n+ coin 500\n</Changes>`);
        await page.locator(`#chat .mes[mesid="${i}"] .mes_edit_done`).click({ timeout: 3000 }).catch(() => {});
    },
    async ui() {
        const k = r.int(1, 5);
        for (let i = 0; i < k; i++) await cmd(page, 'scene.present', r.chance(0.5) ? { add: r.pick(['Ann', 'Bo', 'Cy']) } : { remove: r.pick(['Ann', 'Bo', 'Cy']) });
    },
    async rapidSend() { clearQueue(); queue(reply().text); queue(reply().text); await page.fill('#send_textarea', 'Quick.'); for (let i = 0; i < 4; i++) await page.click('#send_but', { timeout: 1000 }).catch(() => {}); },
    async rapidSwipe() { if (!(await lastIsCarrier())) return; clearQueue(); queue(reply().text); queue(reply().text); const b = page.locator('#chat .mes').last().locator('.swipe_right'); for (let i = 0; i < 3; i++) await b.click({ timeout: 1000 }).catch(() => {}); },
    async swipeDuringGen() {
        await setStream(page, true); clearQueue(); queue(reply(true).text); queue(reply().text);
        await sendText(page, 'Long one.'); await waitGenStart();
        await sleep(r.int(100, 800));
        await page.locator('#chat .mes').last().locator('.swipe_right').click({ timeout: 1500, force: true }).catch(() => {});
        await page.locator('#chat .mes').last().locator('.swipe_left').click({ timeout: 1500, force: true }).catch(() => {});
    },
    async deleteDuringGen() {
        await setStream(page, true); clearQueue(); queue(reply(true).text);
        await sendText(page, 'Long one.'); await waitGenStart();
        await sleep(r.int(100, 800));
        await slash('/del 1');
    },
    async stopMid() {
        await setStream(page, true); clearQueue(); queue(reply(true).text);
        await sendText(page, 'Long one.'); await waitGenStart();
        await sleep(r.int(100, 1200));
        await page.click('#mes_stop', { timeout: 2000 }).catch(() => {});
    },
    async reloadMid() {
        await setStream(page, true); clearQueue(); queue(reply(true).text);
        await sendText(page, 'Long one.'); await waitGenStart();
        await sleep(r.int(100, 1200));
        await reloadPage();
        await ensureChat(main);
        return 'reload';
    },
    async reload() { await reloadPage(); await ensureChat(main); return 'reload'; },
    async switchMid() {
        if (!scratch.length) return;
        await setStream(page, true); clearQueue(); queue(reply(true).text);
        await sendText(page, 'Long one.'); await waitGenStart();
        await sleep(r.int(100, 1000));
        const other = r.pick(scratch);
        await page.evaluate(async c => { await SillyTavern.getContext().openCharacterChat(c); }, other);
        await sleep(2500);
        const shown = await liveChat(page);
        const stray = shown.filter(m => /Long one|The rain keeps falling/.test(m.mes)).length;
        if (stray) note('the reply of chat A landed in chat B after a chat switch mid-generation', `${stray} messages in ${other}`);
        await ensureChat(main);
    },
    async newScratch() {
        await openNarrator(page);
        const id = await chatId(page);
        scratch.push(id);
        await cmd(page, 'party.create', { name: 'Sid', preset: 'fighter' });
        clearQueue(); queue(reply().text); await sendText(page, 'Scratch.'); await idle(page);
        await ensureChat(main);
    },
    async uiThenSwitch() {    // a UI command, then another chat within the 400 ms save window
        if (!scratch.length) return;
        const other = r.pick(scratch);
        const before = fileChat(other)?.length;
        const pname = `P${log.length}`;
        await cmd(page, 'scene.present', { add: pname });
        const live = J(await pageHead(page));
        await sleep(r.int(0, 390));
        await page.evaluate(async c => { await SillyTavern.getContext().openCharacterChat(c); }, other);
        await sleep(1500);
        const after = fileChat(other)?.length;
        if (after !== before) note('chat B file changed by a chat switch', `${other}: ${before} -> ${after} messages on disk`);
        await ensureChat(main);
        const back = await pageHead(page);
        if (!(back?.domains?.scene?.present ?? []).includes(pname)) note('#7 UI command lost: switched chats within 400 ms', pname);
        else if (J(back) !== live) note('state differs after switching away and back (UI command kept)', `rev ${JSON.parse(live)?.meta?.rev} -> ${back?.meta?.rev}`);
        return 'skip7';
    },
    async delScratch() {
        if (!scratch.length) return;
        const id = scratch.pop();
        await ensureChat(id);
        await cmd(page, 'scene.present', { add: `P${log.length}` });
        await sleep(r.int(0, 300));
        await slash('/delchat');
        await sleep(2000);
        if (fs.existsSync(`${SP}/inst/b2-timeline/data/default-user/chats/The Narrator/${id}.jsonl`)) note('a deleted chat file exists again', id);
        await ensureChat(main);
    },
    async branch() {
        const n = await page.evaluate(() => SillyTavern.getContext().chat.length);
        const idxs = await page.evaluate(() => SillyTavern.getContext().chat.map((m, i) => (m.is_user ? -1 : i)).filter(i => i >= 0));
        if (!idxs.length) return;
        const i = r.pick(idxs);
        const want = await page.evaluate(i => { /* state at i as the page sees it after branching */ return i; }, i);
        void want; void n;
        const before = await liveChat(page);
        await slash(`/branch-create ${i}`);
        await sleep(2000);
        const id = await chatId(page);
        if (id !== main) {
            const head = await pageHead(page);
            const { createStore } = await import(`${B}/Story_block/src/v2/store.js`);
            const expect = createStore({ chat: () => before, save: async () => {} }).at(i);
            if (J(head) !== J(expect)) note('#2 branch head != state at that reply', `${i}`);
            scratch.push(id);
            await ensureChat(main);
        }
    },
    async twoTabs() {
        const p2 = await openPage(browser, { errors, label: 'p2' });
        await p2.evaluate(async c => { const ctx = SillyTavern.getContext(); const id = ctx.characters.findIndex(x => x.name === 'The Narrator'); await ctx.selectCharacterById(String(id)); await new Promise(r => setTimeout(r, 1200)); await ctx.openCharacterChat(c); }, main);
        await sleep(1500);
        clearQueue(); queue(reply().text);
        await p2.fill('#send_textarea', 'From tab two.'); await p2.click('#send_but');
        await idle(p2);
        await sleep(800);
        const tab2Head = J(await pageHead(p2));
        const tab2Len = (await liveChat(p2)).length;
        // tab one acts on its stale copy
        await cmd(page, 'scene.present', { add: 'TabOne' });
        await sleep(1200);
        const file = fileChat(main);
        note('two tabs: the file after tab 1 acted', `tab2 had ${tab2Len} messages; file now ${file?.length}; tab-2 reply ${file?.some(m => /From tab two/.test(m.mes)) ? 'kept' : 'LOST'}; head==tab2 ${J(headOf(file)) === tab2Head}`);
        await p2.close();
        return 'skip2';
    },
    async quickSend() {      // the reader answers about 1 s after a reply (dry-run token counts start then)
        clearQueue(); queue(reply().text); queue(reply().text);
        await sendText(page, 'Quick one.');
        await page.waitForFunction(n => SillyTavern.getContext().chat.length >= n, (await page.evaluate(() => SillyTavern.getContext().chat.length)) + 1, { timeout: 15000 }).catch(() => {});
        await sleep(r.int(700, 1300));
        await sendText(page, 'Quick two.').catch(() => {});
    },
    async rename() {
        const len = await page.evaluate(() => SillyTavern.getContext().chat.length);
        if (len < 2) return;
        if (r.chance(0.5)) await cmd(page, 'scene.present', { add: `Rn${log.length}` });
        const nu = `Chaos ${SEED} ${log.length} ${Date.now() % 100000}`;
        await page.evaluate(async ([o, n]) => { await SillyTavern.getContext().renameChat(o, n); }, [main, nu]);
        await sleep(2500);
        const id = await chatId(page);
        if (id !== main) {
            for (const k of [...recorded.keys()]) if (k.startsWith(`${main}|`)) { recorded.set(k.replace(`${main}|`, `${id}|`), recorded.get(k)); recorded.delete(k); }
            main = id;
        }
        return 'restore';
    },
    async death() {
        clearQueue();
        queue(`[R${++rn}] Wolves!\n<Changes>\n! encounter 3 Wolf — circling | tier: deadly | stakes: death\n</Changes>`);
        await sendText(page, 'I walk into the woods.'); await idle(page);
        const offers = await page.evaluate(() => { try { return StoryBlock.sdk.query('combat.offers'); } catch { return null; } });
        const offer = Array.isArray(offers) ? offers.at(-1) : null;
        if (!offer) return;
        await cmd(page, 'combat.start', { offer: offer.id });
        for (let i = 0; i < 80; i++) {
            const s = await page.evaluate(() => StoryBlock.sdk.query('combat.session'));
            if (!s || s.status !== 'active') break;
            await cmd(page, 'combat.act', { action: { type: 'auto' } });
        }
        const point = await page.evaluate(() => { try { return StoryBlock.sdk.query('return.point'); } catch (e) { return { err: e.message }; } });
        if (point && !point.err) {
            const res = await page.evaluate(async p => { const r = await StoryBlock.sdk.rewind({ index: p.index, beforeRev: p.beforeRev }); if (!r.ok) return r; const c = await StoryBlock.sdk.command('return.cue', { fight: p.fight, place: p.place }, { cause: 'system' }); return { ok: c.ok, code: c.code, message: c.message }; }, point);
            if (!res?.ok) note('death return failed', J(res));
            const id = await chatId(page);
            if (id !== main) { scratch.push(main); main = id; }
            return 'reload';
        }
        await cmd(page, 'combat.end', {});
    },
};
const WEIGHTS = { send: 22, swipeRight: 8, swipeLeft: 8, regenerate: 5, cont: 4, deleteLast: 5, deleteMiddle: 2, deleteSwipe: 3, edit: 3, ui: 8,
    rapidSend: 2, rapidSwipe: 2, swipeDuringGen: 4, deleteDuringGen: 2, stopMid: 3, reloadMid: 2, reload: 2, switchMid: 2, newScratch: 1.5,
    uiThenSwitch: 2, delScratch: 0.7, branch: 1.5, twoTabs: 0.6, death: 1, quickSend: 5, rename: 2 };
const names = Object.keys(WEIGHTS);
const total = names.reduce((s, n) => s + WEIGHTS[n], 0);
let stuck = 0;
for (let step = 0; step < STEPS; step++) {
    let x = r() * total, op = names[0];
    for (const n of names) { x -= WEIGHTS[n]; if (x < 0) { op = n; break; } }
    if (step === 3 && !scratch.length) op = 'newScratch';
    log.push(op);
    // a chat without a character (greeting deleted, a new chat): close the wizard, make one
    const noPc = await page.evaluate(() => !StoryBlock.sdk.view().state?.domains?.party?.pc).catch(() => false);
    if (noPc) { await page.evaluate(() => document.querySelector('.ss-dialog-close')?.click()).catch(() => {}); await cmd(page, 'party.create', { name: 'Ren', preset: 'fighter' }); await sleep(500); }
    const before = errors.length;
    if (!['swipeDuringGen', 'deleteDuringGen', 'stopMid', 'reloadMid', 'switchMid'].includes(op)) { stream = r.chance(0.3); await setStream(page, stream).catch(() => {}); }
    let out;
    try { out = await OPS[op](); } catch (e) { note(`harness: ${op} threw`, e.message); }
    let ok = await idle(page, { timeout: 25000 });
    if (!ok) { stuck++; note('stuck generating (stop button still shown after 25 s)', ''); await page.click('#mes_stop').catch(() => {}); await idle(page); }
    await setStream(page, false).catch(() => {});
    await sleep(700);    // the 400 ms UI save and the reply's save
    // checks
    try {
        const id = await chatId(page);
        const chat = await liveChat(page);
        const head = await pageHead(page);
        const replay = headOf(chat);
        if (J(replay) !== J(head)) {
            const last = chat.at(-1); const rec = last?.extra?.storySuite;
            const keys = Object.keys(head?.domains ?? {}).filter(k => J(head.domains[k]) !== J(replay?.domains?.[k]));
            note('#1 page head != replay of the page chat', `${id} page rev ${head?.meta?.rev} replay rev ${replay?.meta?.rev} domains ${keys} | last ${last?.is_user ? 'U' : 'C'} swipe ${last?.swipe_id}/${last?.swipes?.length} rec ${rec ? `${rec.swipe}/${rec.rev}/${rec.receipts.map(r => r.type).join(',')}` : 'none'} info ${J((last?.swipe_info ?? []).map(x => x?.extra?.storySuite ? `${x.extra.storySuite.swipe}/${x.extra.storySuite.rev}` : null))} | prepared page ${J(head?.domains?.checks?.prepared?.map(p => p.for))} replay ${J(replay?.domains?.checks?.prepared?.map(p => p.for))}`);
        }
        let file = fileChat(id);
        if (out !== 'skip7' && file && J(headOf(file)) !== J(head)) {
            await sleep(1500); file = fileChat(id);
            if (J(headOf(file)) !== J(head)) note('#7 chat file head != page head (settled)', `${id} file rev ${headOf(file)?.meta?.rev} page rev ${head?.meta?.rev} file msgs ${file.length} page msgs ${chat.length}`);
        }
        const last = [...chat].reverse().find(m => !m.is_user);
        const tok = tokOf(last?.mes) ?? (chat.length === 1 ? 'G' : null);
        if (tok) {
            const k = `${id}|${tok}|${last?.swipe_id ?? 0}`;
            if (out === 'restore' && recorded.has(k) && recorded.get(k) !== J(head) && out !== 'skip2') note('#2 a reply shown again does not have its state', `${k} rev ${JSON.parse(recorded.get(k))?.meta?.rev} -> ${head?.meta?.rev}`);
            recorded.set(k, J(head));
        }
        // visible <Changes> left in the chat (not captured)
        const bare = chat.filter(m => !m.is_user && /<Changes>/.test(String(m.mes).replace(/<!--[\s\S]*?-->/g, ''))).length;
        if (bare && op !== 'edit') note('a reply shows a bare <Changes> block (not captured)', `${bare} replies`);
    } catch (e) { note('harness check threw', e.message); }
    const newErr = errors.slice(before).filter(e => !/404 \(Not Found\)|No message generated/.test(e));
    if (newErr.length) note('console errors', newErr.slice(0, 3).join(' || '));
    console.log(`op ${step} ${op} stream=${stream}`);
    if (step % 10 === 0) console.log(`step ${step} ${op} chat ${(await liveChat(page).catch(() => [])).length} findings ${findings.length}`);
}
fs.writeFileSync(`${OUT}/findings.json`, JSON.stringify({ seed: SEED, steps: STEPS, log, findings, errors, stuck }, null, 1));
console.log('DONE', JSON.stringify({ findings: findings.length, stuck, errors: errors.length }));
await browser.close();
