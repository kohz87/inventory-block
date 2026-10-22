import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { ev } = h;
await h.openNarrator(process.env.CHAT);
const out = await ev(async () => {
  const c = SillyTavern.getContext();
  await window.storyDirectorInterceptor(c.chat, 8000, () => {}, 'normal');
  const p = c.extensionPrompts ?? {};
  const r = { tail: (p.story_suite_tail_2_story_director?.value ?? '').slice(0, 160), fixed: (p.story_suite_static_story_director?.value ?? '').length, chat: c.chat.length, status: document.querySelector('.story-director-status')?.textContent ?? '' };
  await c.eventSource.emit(c.eventTypes.GENERATION_STOPPED);
  return r;
});
console.log(JSON.stringify(out));
await h.browser.close();
