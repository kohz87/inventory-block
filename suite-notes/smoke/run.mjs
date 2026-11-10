// Smoke run: drives the local SillyTavern (port 8150, separate data root) with the scripted mock (port 5001).
// Usage: node run.mjs [--steps delete,swipe,reread,reload]   Writes a JSON report to $REPORT (default /home/user/st-smoke/report.json).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright');
import { readFileSync, writeFileSync } from 'node:fs';
import { connect, makeCharacter } from './create.mjs';

const script = JSON.parse(readFileSync(new URL('./script.json', import.meta.url), 'utf8'));
const url = process.env.ST_URL ?? 'http://127.0.0.1:8150/';
const report = { started: new Date().toISOString(), errors: [], console: [], toasts: [], turns: [], extra: [] };
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => report.errors.push(String(e?.stack ?? e).slice(0, 600)));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) report.console.push(`${m.type()}: ${m.text()}`.slice(0, 400)); });

const st = (fn, arg) => page.evaluate(fn, arg);
const state = () => st(() => {
    const sb = globalThis.StoryBlock;
    const head = sb?.sdk?.timeline?.head?.() ?? null;
    let domains = null;
    try { domains = Object.keys(sb?.sdk?.state?.()?.domains ?? sb?.sdk?.head?.()?.domains ?? {}); } catch (e) { domains = `err ${e?.message}`; }
    const ctx = globalThis.SillyTavern?.getContext?.();
    const q = (name, args = {}) => { try { return sb?.sdk?.query?.(name, args) ?? null; } catch (e) { return `err ${String(e?.message ?? e).slice(0, 80)}`; } };
    return { chat: ctx?.chatId ?? null, sb: !!sb, version: sb?.version ?? null, domains, wallet: q('inventory.wallet'), clock: q('director.time'), place: q('atlas.here'), threads: (() => { const t = q('director.threads'); return Array.isArray(t) ? t.map(x => `${x.name ?? x.title ?? x.label ?? x.key ?? x.id}:${x.state ?? x.status}`) : t; })(), party: (() => { const p = q('rules.progress', {}); return p && typeof p === 'object' ? { level: p.level, mastery: (p.checklist ?? []).map(c => c.mastery) } : p; })(), progress: q('rules.progress', {}), head: head && { ok: head.ok, code: head.code }, mes: document.querySelectorAll('#chat .mes').length };
});
const toasts = () => st(() => [...document.querySelectorAll('#toast-container .toast')].map(t => `${t.className.includes('error') ? 'ERROR' : t.className.includes('warning') ? 'WARN' : 'info'}: ${t.innerText}`.slice(0, 300)));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.SillyTavern?.getContext && document.querySelector('#send_textarea'), null, { timeout: 120000 });
await page.waitForTimeout(4000);
report.boot = await state();

// A narrator card and the Wessel persona name, created through SillyTavern's own API.
await st(async () => {
    const ctx = SillyTavern.getContext();
    if ((ctx.characters ?? []).some(c => c.name === 'Ersveil')) return;
    const fd = new FormData();
    fd.append('ch_name', 'Ersveil');
    fd.append('description', '{{char}} narrates Ersveil and plays every person in it except {{user}}.');
    fd.append('first_mes', 'Bluewatch, late autumn. The barge noses into the quay.');
    const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
    await fetch('/api/characters/create', { method: 'POST', headers, body: fd });
    await ctx.getCharacters?.();
});
await page.waitForTimeout(1500);
await connect(page);
await st(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/go Ersveil'));
await page.waitForTimeout(4000);
await st(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/newchat'));
await page.waitForTimeout(4000);
report.created = await makeCharacter(page, s => report.extra.push(`create: ${s}`.slice(0, 200)));
await page.waitForTimeout(3000);
report.afterCard = await state();

async function send(text) {
    const before = (await state()).mes;
    await page.fill('#send_textarea', text);
    await page.press('#send_textarea', 'Enter');
    await page.waitForFunction(n => document.querySelectorAll('#chat .mes').length >= n + 2 && !document.querySelector('#send_but')?.classList.contains('displayNone') , before, { timeout: 90000 }).catch(() => report.extra.push(`timeout after: ${text}`));
    await page.waitForTimeout(2500);
}
// A fight offer (Game view → Fight tab → Fight), fought with Auto until no action buttons remain, then closed.
async function fight() {
    const out = { steps: [] };
    const click = async (scope, name) => {
        const b = scope.getByRole('button', { name });
        for (let n = 0; n < await b.count(); n++) if (await b.nth(n).isVisible()) { await b.nth(n).click(); await page.waitForTimeout(2000); out.steps.push(String(name)); return true; }
        out.steps.push(`missing ${name}`); return false;
    };
    await click(page, 'Game view');
    const view = page.getByRole('dialog', { name: 'Game view' });
    await click(view, /Fight/);
    await click(view, /^\s*Fight\s*$/);
    for (let round = 0; round < 40; round++) {
        if (!(await view.getByRole('button', { name: /^\s*Auto\s*$/ }).count())) break;
        await click(view, /^\s*Auto\s*$/);
        out.rounds = round + 1;
    }
    await click(view, /^\s*Finish/);
    out.text = (await view.innerText().catch(() => '')).split('\n').filter(line => /won|lost|victory|defeat|fled|loot|xp|coin|mastery/i.test(line)).slice(0, 12);
    await page.screenshot({ path: '/home/user/st-smoke/fight.png' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    out.state = await state();
    return out;
}
// Buttons a reader can press in the latest reply (fight offers, quest choices).
const offered = () => page.locator('#chat .mes').last().getByRole('button').allInnerTexts().then(list => list.map(b => b.trim()).filter(Boolean)).catch(() => []);
for (const t of script.turns) {
    await send(t.user);
    const buttons = await offered();
    const entry = { user: t.user, state: await state(), toasts: await toasts(), buttons };
    // A fight offer: accept it, then let the fight run to its end (auto-resolve when the screen offers it).
    if (t.fight) entry.fight = await fight();
    report.turns.push(entry);
}
// Edits around history: delete the last reply, swipe, reload.
const steps = (process.argv.find(a => a.startsWith('--steps=')) ?? '--steps=delete,reload').slice(8).split(',');
for (const step of steps) {
    if (step === 'delete') await st(async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/del 1'));
    if (step === 'swipe') await page.click('#chat .mes.last_mes .swipe_right').catch(() => report.extra.push('no swipe button'));
    if (step === 'reload') {
        const chat = (await state()).chat;
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => globalThis.SillyTavern?.getContext && document.querySelector('#send_textarea'), null, { timeout: 120000 });
        await page.waitForTimeout(6000);
        await st(async name => { const ctx = SillyTavern.getContext(); await ctx.executeSlashCommandsWithOptions?.('/go Ersveil'); if (ctx.chatId !== name) await ctx.openCharacterChat?.(name); }, chat);
    }
    await page.waitForTimeout(4000);
    report.extra.push({ step, state: await state(), toasts: await toasts() });
}
report.finished = new Date().toISOString();
writeFileSync(process.env.REPORT ?? '/home/user/st-smoke/report.json', JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ errors: report.errors.length, console: report.console.length, turns: report.turns.length, boot: report.boot, last: report.turns.at(-1)?.state }, null, 1));
