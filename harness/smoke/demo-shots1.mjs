import { open, S } from './demo-common.mjs';
const O = `${S}/shots/readme`;
const h = await open({ width: 1440, height: 900 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
await h.dock();
const scrollChatEnd = () => ev(() => { const c = document.querySelector('#chat'); c.scrollTop = c.scrollHeight; });
await scrollChatEnd(); await page.waitForTimeout(800);
for (const [id, file] of [['block:world-state', 'sb-world'], ['block:inventory', 'sb-inventory'], ['block:choices', 'sb-choices'], ['ext:story-director', 'sd-director'], ['ext:story-director-quests', 'sd-quests'], ['ext:npc-state-delta-cast', 'nsd-present'], ['ext:rpg-party', 'rpg-party']]) {
  await h.tab(id); await page.waitForTimeout(600);
  await page.screenshot({ path: `${O}/${file}.png` });
  console.log(file, (await h.pane()).slice(0, 120));
}
// The dice card in the chat.
const dice = page.locator('#chat .mes').last().locator('xpath=preceding-sibling::div[contains(@class,"mes")][1]');
await page.screenshot({ path: `${O}/sb-chat.png` });
// Story Suite overlay.
await ev(() => window.StorySuite.api('story-block').openSuite('overview')); await page.waitForTimeout(1200);
await ev(() => { for (const d of document.querySelectorAll('.story-suite-overlay details.story-suite-fold')) d.open = true; }); await page.waitForTimeout(400);
await page.screenshot({ path: `${O}/suite-overview.png` });
await page.keyboard.press('Escape'); await page.waitForTimeout(500);
// NSD dossier.
await ev(() => window.NPCStateDelta.openDossier?.('npc_captain-kael')); await page.waitForTimeout(1500);
await page.screenshot({ path: `${O}/nsd-dossier.png` });
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
