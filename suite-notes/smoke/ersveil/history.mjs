import { writeFileSync } from 'node:fs';
import { launch, ev, SC, send, toasts } from './lib.mjs';
import { connect, openChat } from './create.mjs';
const { browser, page, errors, cons } = await launch();
await connect(page); await openChat(page);
const snap = () => ev(page, () => {
    const s = StoryBlock.sdk; const Q = (n, a = {}) => { try { return s.query(n, a); } catch (e) { return 'err ' + e.message; } };
    const party = Q('rules.party', {}).active?.map(a => ({ n: a.name, level: a.level, xp: a.xp, hp: a.hp, life: a.life, skills: a.skills?.map(k => k.name + ':' + k.mastery) }));
    return {
        mes: document.querySelectorAll('#chat .mes').length,
        wallet: Q('inventory.wallet'), clock: Q('director.time'), here: Q('atlas.here')?.name, party,
        quests: Q('rules.quests', {}).map(x => [x.title, x.template, x.state, x.reward.coin, x.reward.xp]),
        trainers: (Q('training.trainers', {}) || []).filter?.(t => t.by === 'story').map(t => [t.name, t.template, t.fee]),
        adj: Q('quest.adjustments', { limit: 20 })?.rows?.map(r => [r.name, r.band, r.became]),
        standing: Q('dataModules.view', { module: 'pack.ersveil/standing' })?.chat?.standing?.guild,
        fame: Q('dataModules.view', { module: 'pack.ersveil/fame' })?.chat?.fame && { bw: Q('dataModules.view', { module: 'pack.ersveil/fame' }).chat.fame.bluewatch, au: Q('dataModules.view', { module: 'pack.ersveil/fame' }).chat.fame.auvoth },
        guild: Q('dataModules.view', { module: 'pack.ersveil/guild-membership' })?.chat,
        receipts: s.receipts().filter(x => !/chronicle\.note/.test(x.receipt.type)).map(x => [x.index, x.receipt.type, (x.receipt.summary ?? '').slice(0, 80)]),
    };
});
const diff = (a, b) => { const out = []; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push(k); return out; };
const log = (...a) => console.log(...a);
const shot = async n => page.screenshot({ path: `${SC}/hist-${n}.png` });
const S = {};
S.live0 = await snap(); writeFileSync(SC + '/snap-live0.json', JSON.stringify(S.live0, null, 1));
log('live0 guild', JSON.stringify(S.live0.guild), 'mes', S.live0.mes);
// B: delete the last reply (the register)
await ev(page, async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/del 1')); await page.waitForTimeout(4000);
S.del = await snap(); log('after /del 1: mes', S.del.mes, 'guild', JSON.stringify(S.del.guild), 'diff keys vs live0:', diff(S.live0, S.del));
log('  receipts last:', JSON.stringify(S.del.receipts.slice(-2)));
// remove the user line too, so the last message is a reply that can be swiped
await ev(page, async () => SillyTavern.getContext().executeSlashCommandsWithOptions?.('/del 1')); await page.waitForTimeout(3000);
S.del2 = await snap(); log('after 2nd /del 1: mes', S.del2.mes, 'diff vs del:', diff(S.del, S.del2).filter(k => k !== 'mes'));
// C: swipe the last reply (the spread line); the mock answers the same text again
const before = S.del2;
await page.click('#chat .mes.last_mes .swipe_right').catch(() => log('no swipe button'));
await page.waitForFunction(() => !document.querySelector('#send_but')?.classList.contains('displayNone'), null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(5000);
S.swipe = await snap(); log('after swipe: mes', S.swipe.mes, 'diff vs del2:', diff(before, S.swipe).filter(k => k !== 'mes'), 'fame', JSON.stringify(S.swipe.fame));
log('  swipe receipts last:', JSON.stringify(S.swipe.receipts.slice(-2)), 'swipe id', await ev(page, () => document.querySelector('#chat .mes.last_mes .swipes-counter')?.textContent));
// D: play the register line again; state must equal live0
await send(page, 'I sign the Guild register.', 3500);
S.again = await snap(); log('after re-send: guild', JSON.stringify(S.again.guild), 'diff vs live0:', diff(S.live0, S.again));
await shot('after-resend');
// E: reload
const chat = await ev(page, () => SillyTavern.getContext().chatId);
const pre = S.again;
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => globalThis.StoryBlock?.sdk && document.querySelector('#send_textarea'), null, { timeout: 120000 }); await page.waitForTimeout(6000);
await ev(page, async name => { const ctx = SillyTavern.getContext(); await ctx.executeSlashCommandsWithOptions?.('/go Ersveil'); if (ctx.chatId !== name) await ctx.openCharacterChat?.(name); }, chat); await page.waitForTimeout(6000);
S.reload = await snap(); log('after reload: diff vs live:', diff(pre, S.reload), 'mes', S.reload.mes);
writeFileSync(SC + '/snap-reload.json', JSON.stringify(S.reload, null, 1));
for (const k of diff(pre, S.reload)) log('  ', k, JSON.stringify(pre[k]), '=>', JSON.stringify(S.reload[k]));
log(JSON.stringify({ errors, cons: cons.filter(c => !/Settings not ready/.test(c)) }));
await browser.close();
