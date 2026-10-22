// Makes a chat with content in every module: pack, character, places, items, quest, npc, fight offer.
import fs from 'node:fs';
import { launch, waitHost, connect, narrator, newChat, send, cmd, R, j, ST_URL, clearQueue } from './common.mjs';
const PACK = '/home/user/_break/ui/Story_block/examples/packs/ersveil-bluewatch/pack.json';
const { browser, page, errors } = await launch();
clearQueue();
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
console.log('pack', j(await page.evaluate(async text => {
    const mod = await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js');
    if (mod.packs.list().some(p => p.id === 'ersveil-bluewatch')) return 'already';
    const r = await mod.packs.install(text, { source: 'file', origin: 'pack.json' });
    return { ok: r.ok, errors: r.errors };
}, fs.readFileSync(PACK, 'utf8'))));
await page.evaluate(() => SillyTavern.getContext().saveSettings?.());
await page.waitForTimeout(4000);
await page.reload({ waitUntil: 'domcontentloaded' });
await waitHost(page);
await connect(page);
await narrator(page);
const chat = await newChat(page);
console.log('chat', chat);
console.log('creation', j(await cmd(page, 'creation.finish', { name: 'Ren', preset: 'wessel-kit', race: 'human', talents: ['shadow-bent', 'river-born'], points: { STR: 0, VIT: 1, AGI: 2, DEX: 3, INT: 1, LUK: 1, CHA: 0 } })));
await send(page, 'I step off the barge.', null, { wait: 4000 });
console.log('dialog', j(await page.evaluate(() => document.querySelector('.ss-dialog')?.innerText?.slice(0, 300))));
const preset = await page.evaluate(() => { const b = document.querySelector('.ss-dialog .rpg-preset-go'); b?.click(); return !!b; });
await page.waitForTimeout(600);
for (let i = 0; i < 8; i += 1) {
    const next = await page.evaluate(() => { const b = document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])'); b?.click(); return !!b; });
    await page.waitForTimeout(500);
    if (!next) break;
}
console.log('wizard', preset, j(await page.evaluate(async () => { const b = document.querySelector('.ss-dialog-submit:not([hidden])') ?? document.querySelector('.ss-dialog .cc-go'); b?.click(); await new Promise(r => setTimeout(r, 2500)); return { clicked: !!b, dialog: !!document.querySelector('.ss-dialog'), error: document.querySelector('.ss-dialog-error')?.textContent ?? null, pc: StoryBlock.sdk.query('party.pc')?.name }; })));
await page.evaluate(async () => { const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });
await send(page, 'I go into the Guild office and look at the board.', R('Fenna, the Guild clerk, taps the board. "Rats in the Watch granary. Fifty marks."', [
    '~ place Bluewatch Village | kind: settlement | region: River Confederacy',
    '+ present Fenna',
    '+ quest Granary Rats — Fenna wants the Watch granary cellar cleared | giver: Fenna | goal: Kill 6 cellar rats | reward: 50 marks',
    '~ npc Fenna | trust: +10',
    '+ faction Bluewatch Watch — the garrison | area: Bluewatch | stance: wary but fair',
    '+ item Healing Salve | qty: 1 | note: for the bites',
    '+ item <b>Bold</b> Rope <img src=x onerror="window.__xss=1"> | qty: 2',
    '! time +20m',
]));
await send(page, "I'll take the rat job.", R('"Good," Fenna says. Down in the cellar a swarm of rats pours out of the bins.', [
    '! encounter 3 Cellar Rat — pouring out of the bins | tier: weak | stakes: normal',
    '~ wound Ren — a bite on the ankle | harm: scratch',
]));
console.log('state', j(await page.evaluate(() => ({ len: SillyTavern.getContext().chat.length, items: StoryBlock.sdk.query('inventory.items', {})?.map?.(i => i.name), pc: StoryBlock.sdk.query('party.pc')?.name, xss: window.__xss ?? null }))));
fs.writeFileSync(new URL('./chat.json', import.meta.url), JSON.stringify({ chat }));
console.log('errors', errors.join('\n'));
await browser.close();
