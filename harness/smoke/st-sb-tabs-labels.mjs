import { open, S } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(1500);
await h.dock();
// Story Director and NPC State Delta switched off for this shot (restored below).
await ev(() => { const s = SillyTavern.getContext().extensionSettings; s.storyDirector.enabled = false; s.npc_state_delta.enabled = false; });
await ev(() => { window.StoryBlock?.refresh?.(); });
await page.waitForTimeout(1200);
const info = await ev(() => { const strip = document.querySelector('.story-block-sidebar-tabs'); return { fit: strip.getAttribute('data-fit'), tabs: [...strip.querySelectorAll('.story-block-sidebar-tab')].map(t => t.title).join(' · ') }; });
console.log('two extensions off:', JSON.stringify(info));
await page.screenshot({ path: `${S}/uiux/rows/rows-desktop-labels.png` });
await ev(() => { const s = SillyTavern.getContext().extensionSettings; s.storyDirector.enabled = true; s.npc_state_delta.enabled = true; window.StoryBlock?.refresh?.(); });
await page.waitForTimeout(1200);
console.log('back on:', await ev(() => { const strip = document.querySelector('.story-block-sidebar-tabs'); return strip.getAttribute('data-fit') + ' · ' + strip.querySelectorAll('.story-block-sidebar-tab').length + ' tabs'; }));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
