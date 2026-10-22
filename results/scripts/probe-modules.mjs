// One configuration of installed modules (set up by run-modules.sh): every surface, the overlay, a reply with
// every module's change lines, the drawer's "needs Story Block" lines.
import fs from 'node:fs';
import { launch, waitHost, connect, ST_URL, shot, j, queue, clearQueue, send, R } from './common.mjs';
import { openChat, probeSurfaces } from './lib-ui.mjs';
const { chat } = JSON.parse(fs.readFileSync(new URL('./chat.json', import.meta.url)));
const TAG = process.env.TAG;
const { browser, page, errors } = await launch({ width: Number(process.env.W ?? 1440), height: 900 });
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.() && document.querySelector('#send_but'), null, { timeout: 120000 });
await page.waitForTimeout(8000);
const hasSb = await page.evaluate(() => window.StoryBlock?.apiVersion === 2);
const out = { tag: TAG, hasSb };
if (hasSb) {
    await waitHost(page).catch(() => {});
    await connect(page); await openChat(page, chat);
    out.modules = await page.evaluate(() => StoryBlock.sdk.modules().map(m => `${m.id}@${m.version}`));
    out.features = await page.evaluate(() => StoryBlock.sdk.features().map(f => `${f.id}=${f.on}`));
    out.needs = await page.evaluate(() => [...document.querySelectorAll('[class*="needs"], .story-suite-problem, .story-suite-muted')].map(n => n.textContent.replace(/\s+/g, ' ').trim()).filter(t => /needs Story Block|Update Story Block|refused|not installed|missing/i.test(t)).slice(0, 6));
    const e0 = errors.length;
    out.surfaces = await probeSurfaces(page);
    await shot(page, `mod-${TAG}-chat`);
    await page.evaluate(() => document.querySelector('.story-suite-bar-game')?.click());
    await page.waitForTimeout(800);
    await shot(page, `mod-${TAG}-home`);
    out.home = await page.evaluate(() => document.querySelector('.ss-gameview-main, .ss-gameview-body')?.innerText?.replace(/\s+/g, ' ').slice(0, 300));
    await page.evaluate(() => document.querySelector('.ss-gameview-close')?.click());
    await page.evaluate(() => document.querySelector('.story-suite-bar-settings')?.click());
    await page.waitForTimeout(500);
    out.overlay = await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_overlay details.story-suite-fold > summary')].map(s => s.textContent.replace(/\s+/g, ' ').trim()));
    await page.evaluate(() => document.querySelector('#story_suite_v2_overlay .menu_button')?.click());
    clearQueue();
    await send(page, 'I look around the quay.', R('Rats boil out of a crate; Fenna nods to you and the rain begins.', [
        '! encounter 2 Dock Rat — out of a crate | tier: weak | stakes: normal',
        '~ npc Fenna | trust: +5',
        '! time +10m',
        '+ item Wet Rope | qty: 1',
        '+ quest Crate Rats — clear the crate | giver: Fenna | goal: Kill 2 dock rats | reward: 5 marks',
    ]));
    out.reply = await page.evaluate(() => { const m = [...document.querySelectorAll('#chat .mes')].at(-1); const c = SillyTavern.getContext().chat.at(-1); return { receipts: (c.extra?.storySuite?.receipts ?? []).map(r => r.type), card: m?.querySelector('.ss-card')?.innerText?.replace(/\s+/g, ' ').slice(0, 300), problems: (c.extra?.storySuite?.problems ?? []).map(p => `${p.code}:${String(p.message).slice(0, 100)}`) }; });
    await page.evaluate(() => { for (const c of [...document.querySelectorAll('#chat .mes')].at(-1)?.querySelectorAll('.ss-card-head') ?? []) c.click(); });
    await page.waitForTimeout(400);
    await shot(page, `mod-${TAG}-reply`);
    out.errors = errors.slice(e0).filter(e => !/dossier scan failed|404 \(Not Found\)/.test(e));
    // put the chat back: delete the reply and the message
    await page.evaluate(async () => { const c = SillyTavern.getContext(); await c.deleteLastMessage(); await c.deleteLastMessage(); await c.saveChat(); });
} else {
    out.body = await page.evaluate(() => document.querySelector('#story_suite_v2_bar')?.innerText ?? null);
}
out.allErrors = errors.filter(e => !/dossier scan failed|404 \(Not Found\)/.test(e));
console.log(j(out));
fs.writeFileSync(new URL(`./out-mod-${TAG}.json`, import.meta.url), JSON.stringify(out, null, 1));
await browser.close();
