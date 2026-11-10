import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@14h00m00s000ms');
await page.waitForTimeout(1500);
const out = await ev(async () => {
  const root = document.getElementById('npc_state_delta_settings');
  if (!root) return { error: 'no panel' };
  const group = root.querySelector('[data-delta-settings-group="scanning"]');
  group.open = false; await new Promise(r => setTimeout(r, 50));
  group.open = true; group.dispatchEvent(new Event('toggle')); await new Promise(r => setTimeout(r, 300));
  const smalls = [...group.querySelectorAll('.npc-state-delta-setting-row > span:first-child > small')];
  const compacted = smalls.filter(s => s.querySelector('.delta-hint-more'));
  const box = document.getElementById('npc_state_delta_narration_capture');
  const before = box?.checked;
  const row = box?.closest('.npc-state-delta-setting-row');
  const more = row?.querySelector('.delta-hint-more');
  more?.click(); await new Promise(r => setTimeout(r, 100));
  const small = more?.parentElement;
  return {
    rows: smalls.length, compacted: compacted.length,
    sample: compacted[0] ? compacted[0].firstChild.textContent : '',
    captureHintShown: small ? small.innerText.slice(0, 80) : 'n/a',
    openAfterMore: small?.classList.contains('is-open'), moreLabel: more?.textContent,
    checkboxUnchanged: box ? box.checked === before : 'n/a',
    allSettingsStillThere: ['npc_state_delta_scan_every', 'npc_state_delta_scan_depth', 'npc_state_delta_admission_mode', 'npc_state_delta_full_scan_every_turn'].map(id => Boolean(document.getElementById(id))),
  };
});
console.log(JSON.stringify(out, null, 1));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
