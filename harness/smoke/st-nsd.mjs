import { open, S } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const out = await ev(async () => {
  const ctx = SillyTavern.getContext();
  const s = ctx.extensionSettings.npc_state_delta;
  Object.assign(s, { enabled: true, autoScan: true, narrationCapture: true, fullScanEveryTurn: false, scanEvery: 9 });
  const before = { ...window.NPCStateDelta.uiStatus().narrationCapture };
  ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: 'I ask Danique about the guild token.', extra: {} });
  await ctx.eventSource.emit(ctx.eventTypes.GENERATION_AFTER_COMMANDS, 'normal', {}, false);
  const armed = window.NPCStateDelta.uiStatus().narrationCapture.armed;
  const capture = JSON.stringify({ npcs: [{ name: 'Danique', present: true, mood: 'tired', condition: 'unhurt' }] });
  // A reply Story Block rewrites on arrival: its envelope glued to the last line.
  const mes = `Danique turns the iron token over. "Rank F. Don't lose it."<!-- STORY_BLOCKS_V1\n<Blocks>\n<CYOA>\n1. Ask about work.\n2. Leave.\n</CYOA>\n</Blocks>\n-->\n<!-- npc_state_delta\n${capture}\n-->`;
  const reply = { name: 'The Narrator', is_user: false, is_system: false, send_date: new Date().toISOString(), mes, swipes: [mes], swipe_id: 0, extra: {} };
  ctx.chat.push(reply); ctx.addOneMessage(reply);
  await ctx.eventSource.emit(ctx.eventTypes.MESSAGE_RECEIVED, ctx.chat.length - 1);
  await new Promise(r => setTimeout(r, 4000));
  const after = { ...window.NPCStateDelta.uiStatus().narrationCapture };
  return { armed, before, after, rewritten: ctx.chat.at(-1).mes !== mes, metrics: window.NPCStateDelta.uiStatus().lastScanMetrics ?? null };
});
console.log(JSON.stringify(out, null, 1));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
