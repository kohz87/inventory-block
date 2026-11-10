import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(1500);
const stored = await ev(() => SillyTavern.getContext().extensionSettings.storyBlock.blocks.find(b => b.template === 'inventory').prompt);
console.log('stored has line:', /word for word/.test(stored));
// What the next reply is sent: the interceptor builds the extension prompt.
const ctx = 'x';
const sent = await ev(async () => {
  const c = SillyTavern.getContext();
  c.chat.push({ name: c.name1, is_user: true, is_system: false, mes: "I look in my pack.", extra: {} }); await window.storyBlockGenerationInterceptor(c.chat, 8000, () => {}, "normal");
  const data = { chat: [{ role: "system", content: "Story." }, { role: "user", content: "I look in my pack." }], dryRun: false }; await c.eventSource.emit(c.eventTypes.CHAT_COMPLETION_PROMPT_READY, data); return JSON.stringify(c.extensionPrompts ?? {}) + JSON.stringify(data);
});
const m = sent.match(/Copy every row.{0,200}/) ?? [sent.match(/.{0,300}Inventory.{0,300}/)?.[0] ?? sent.slice(0, 600)];
console.log('sent to the model:', m ? m[0] : 'not found');
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
