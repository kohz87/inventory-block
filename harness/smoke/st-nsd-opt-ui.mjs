// Load check: NSD version, dossier panel and continuity editor open without errors.
import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await page.waitForTimeout(4000);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await page.waitForTimeout(3000);
console.log('version', await ev(() => window.NPCStateDelta?.version));
const npcs = await ev(() => (window.NPCStateDelta.getDossierState?.().npcs || []).map(n => n.name));
console.log('npcs', JSON.stringify(npcs));
if (npcs[0]) {
  console.log('openDossier', await ev(name => window.NPCStateDelta.openDossier(name), npcs[0]));
  await page.waitForTimeout(1500);
  console.log('dossier root html', await ev(() => (document.getElementById('npc_state_delta_dossier_root')?.innerHTML || '').length));
  console.log('openEditor', await ev(name => window.NPCStateDelta.openEditor(name), npcs[0]));
  await page.waitForTimeout(1500);
  console.log('form editor present', await ev(() => !!document.querySelector('[id*="npc_state_delta"][id*="form"], .npc-state-delta-continuity, [class*="continuity"]')));
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
