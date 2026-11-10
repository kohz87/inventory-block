import { open } from './demo-common.mjs';
const h = await open({ width: 1200, height: 900 });
const { ev, page } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(1500);
console.log(await ev(async () => {
  const blocks = StoryBlock.listBlocks();
  const scene = blocks.filter(b => b.display === 'scene').map(b => `${b.tag}/${b.enabled}`);
  const mes = SillyTavern.getContext().chat.at(-1).mes;
  const found = StoryBlock.blockInText(mes, 'World_State');
  const mod = await import('/scripts/extensions/third-party/npc_state_delta/present-scene.js');
  return JSON.stringify({ scene, version: window.NPCStateDelta?.version ?? null, found: Boolean(found), people: mod.worldStatePeople(found?.text ?? '') , sample: blocks.slice(0, 4).map(b => `${b.tag}:${b.display}:${b.enabled}`) });
}));
await h.browser.close();
