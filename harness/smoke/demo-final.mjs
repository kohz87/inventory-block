import { open, S } from './demo-common.mjs';
const O = `${S}/shots/final`;
const FILE = 'The Narrator - 2026-10-18@01h44m00s947ms';
const tidy = h => h.ev(() => { const t = document.querySelector('#send_textarea'); if (t) t.placeholder = 'Type a message…'; });
{
  const h = await open({ width: 1440, height: 1000 });
  const { page, ev } = h;
  const side = file => page.screenshot({ path: `${O}/${file}.png`, clip: { x: 1090, y: 40, width: 350, height: 950 } });
  await h.openNarrator(FILE); await h.dock(); await tidy(h);
  await ev(() => { const c = document.querySelector('#chat'); c.scrollTop = c.scrollHeight; }); await page.waitForTimeout(600);
  await h.tab('block:world-state'); await page.screenshot({ path: `${O}/story-block.png` });
  await side('story-block-world');
  await h.tab('block:inventory'); await side('story-block-inventory');
  await h.tab('block:choices'); await side('story-block-choices');
  await h.tab('ext:story-director'); await h.click('^Reveal'); await page.waitForTimeout(600); await side('story-director');
  await h.tab('ext:story-director-quests'); await ev(() => { for (const d of document.querySelectorAll('.story-block-pane details')) d.open = true; }); await page.waitForTimeout(400); await side('story-director-quests');
  await h.tab('ext:npc-state-delta-cast'); await side('npc-state-delta-present');
  await ev(() => window.StorySuite.api('story-block').openSuite('overview')); await page.waitForTimeout(1200);
  await ev(() => { for (const d of document.querySelectorAll('.story-suite-overlay details.story-suite-fold')) d.open = true; }); await page.waitForTimeout(400);
  await page.screenshot({ path: `${O}/story-suite.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await ev(() => window.NPCStateDelta.openDossier?.('npc_lyra')); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${O}/npc-state-delta-dossier.png` });
  console.log('desktop errors:', h.errors.join('\n') || 'none');
  await h.browser.close();
}
{
  const h = await open({ width: 390, height: 844, mobile: true });
  const { page, ev } = h;
  await h.openNarrator(FILE); await tidy(h);
  await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(900);
  await h.tab('block:world-state'); await page.screenshot({ path: `${O}/story-block-phone.png` });
  await h.tab('ext:npc-state-delta-cast'); await page.screenshot({ path: `${O}/npc-state-delta-phone.png` });
  console.log('phone errors:', h.errors.join('\n') || 'none');
  await h.browser.close();
}
