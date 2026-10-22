import { open } from './demo-common.mjs';
const h = await open({ width: 1180, height: 820 });
const { ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
console.log(await ev(() => JSON.stringify(globalThis.StoryBlock.getBlock('Inventory')?.state).slice(0, 1500)));
console.log(await ev(() => Object.keys(globalThis.StoryBlock).join(',')));
await h.browser.close();
