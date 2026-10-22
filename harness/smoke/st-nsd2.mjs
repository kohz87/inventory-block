import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
for (const delay of [0, 20, 80, 200, 600]) {
  const out = await ev(async d => {
    const ctx = SillyTavern.getContext();
    Object.assign(ctx.extensionSettings.npc_state_delta, { enabled: true, autoScan: true, narrationCapture: true, fullScanEveryTurn: false, scanEvery: 9 });
    const before = window.NPCStateDelta.uiStatus().narrationCapture;
    ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: `I ask Danique about the token (${d}).`, extra: {} });
    await ctx.eventSource.emit(ctx.eventTypes.GENERATION_AFTER_COMMANDS, 'normal', {}, false);
    const capture = JSON.stringify({ npcs: [{ name: 'Danique', present: true, mood: 'tired' }] });
    const mes = `Danique turns the iron token over. "Rank F."\n<!-- npc_state_delta\n${capture}\n-->`;
    const reply = { name: 'The Narrator', is_user: false, is_system: false, send_date: new Date().toISOString(), mes, swipes: [mes], swipe_id: 0, extra: {} };
    ctx.chat.push(reply); ctx.addOneMessage(reply);
    const at = ctx.chat.length - 1;
    // Another extension writes into the reply a moment later (a sheet, a Director line).
    setTimeout(() => { ctx.chat[at].mes += `\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<Party kept="RPG Battle">\nHP 74/74\n</Party>\n</Blocks>\n-->`; }, d);
    await ctx.eventSource.emit(ctx.eventTypes.MESSAGE_RECEIVED, at);
    await new Promise(r => setTimeout(r, 3000));
    const after = window.NPCStateDelta.uiStatus().narrationCapture;
    return { used: after.used - before.used, pending: after.pending };
  }, delay);
  console.log(`rewrite after ${delay}ms:`, JSON.stringify(out));
}
await h.browser.close();
