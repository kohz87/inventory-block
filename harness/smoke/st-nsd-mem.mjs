// 1.2.19 live check: reply A creates Elke with M1, reply B adds M2 for the now-existing Elke.
// Phase "full": full one-pass rules, M2 filed under profileUpdates (the route that used to drop it).
// Phase "compact": compact one-pass rules on, M2 in Elke's npcs[] entry (the route the rules now name).
import { open } from './demo-common.mjs';
import fs from 'node:fs';
const OUT = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/uiux/nsd-mem';
const Q = process.env.MOCK_Q, LOG = process.env.MOCK_LOG;
const M1 = "Stamped Astra's first rat-cull bounty slip and logged sixty-four tails";
const M2 = "Warned Astra that Brecht's dock boys target anyone carrying board silver";
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await ev(async () => {
  const $ = window.jQuery;
  $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 500));
  $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 500));
  $('#custom_api_url_text').val((window.__MOCK_URL || 'http://127.0.0.1:5099/v1')).trigger('input');
  $('#custom_model_id').val('mock-model').trigger('input');
  $('#stream_toggle').prop('checked', false).trigger('change');
  $('#api_button_openai').trigger('click');
  $('#oai_max_context_unlocked').prop('checked', true).trigger('input').trigger('change'); await new Promise(r => setTimeout(r, 300));
  $('#openai_max_context').val(120000).trigger('input'); $('#openai_max_context_counter').val(120000).trigger('input');
  const s = SillyTavern.getContext().extensionSettings.npc_state_delta; s.narrationCapture = true; s.narrationCaptureCatchUp = 0;
});
await page.waitForTimeout(4000);
const block = obj => `\n\n<!--npc_state_delta\n${JSON.stringify(obj)}\n-->`;
const send = async (text, reply) => {
  const n = await ev(() => SillyTavern.getContext().chat.length);
  fs.writeFileSync(`${Q}/1.txt`, reply);
  await page.fill('#send_textarea', text);
  await page.click('#send_but');
  await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k, n + 2, { timeout: 60000 });
  await page.waitForTimeout(6000);
};
const memories = () => ev(() => JSON.stringify(globalThis.NPCStateDelta?.getState?.().npcs?.find(n => n.name === 'Elke')?.memories ?? 'no Elke'));
const A = { npcs: [{ name: 'Elke', identityKind: 'proper_name', dossierSignal: 'strong', dossierReason: 'named guild clerk the player deals with', directInteraction: true, present: true, worldActive: false, role: 'Guild intake clerk', personality: 'Brisk, dry, fair.', memories: [M1], relationshipImpact: 'ordinary', relationshipDelta: { trust: 1, affection: 0, desire: 0, tension: 0 }, relationshipEvidence: { trust: 'stamped the slip without fuss', affection: '', desire: '', tension: '' } }] };

for (const phase of ['full', 'compact']) {
  await ev(on => { SillyTavern.getContext().extensionSettings.npc_state_delta.narrationCaptureCompact = on; }, phase === 'compact');
  await h.openNarrator(phase === 'full' ? 'The Narrator - 2026-10-18@09h00m00s000ms' : 'The Narrator - 2026-10-18@09h30m00s000ms');
  await page.waitForTimeout(2000);
  for (const f of fs.readdirSync(LOG)) fs.unlinkSync(`${LOG}/${f}`);
  await send('I hand Elke my rat tails.', `Elke counts the tails twice, stamps the slip and slides the coins across. "Sixty-four. Not bad for a first cull."${block(A)}`);
  console.log(`[${phase}] after A:`, await memories());
  const id = await ev(() => globalThis.NPCStateDelta.getState().npcs.find(n => n.name === 'Elke')?.id);
  const B = phase === 'full'
    ? { npcs: [{ id, name: 'Elke', present: true }], profileUpdates: [{ id, evidence: { personality: ['lowers her voice to warn the player'] }, memories: [M2] }] }
    : { npcs: [{ id, name: 'Elke', present: true, memories: [M2] }] };
  await send('I ask Elke about the docks.', `Elke leans over the counter and lowers her voice. "Brecht's dock boys watch for anyone carrying board silver. Go around."${block(B)}`);
  console.log(`[${phase}] after B (${phase === 'full' ? 'profileUpdates' : 'npcs[]'}):`, await memories());
  const reqs = fs.readdirSync(LOG).filter(f => f.startsWith('req')).sort().map(f => JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8')));
  const text = reqs.map(r => (r.messages ?? []).map(m => typeof m.content === 'string' ? m.content : '').join('\n'));
  console.log(`[${phase}] requests: ${reqs.length}; rules sent: full rule 14 ${text.filter(t => t.includes('14. Memories: max3 NEW in npcs[] (existing too), ADDED to cap5 stored')).length}, compact rule 10 ${text.filter(t => t.includes('10. memories, in npcs[] for existing NPCs too')).length}, reminder ${text.filter(t => t.includes('(memories: only the new one, in its npcs[] entry)')).length}`);
  console.log(`[${phase}] stored reply has no block:`, await ev(() => !/npc_state_delta/.test(SillyTavern.getContext().chat.at(-1).mes)));
  await ev(n => globalThis.NPCStateDelta.openDossier(n), 'Elke');
  await page.waitForTimeout(1500);
  await ev(() => document.querySelector('[data-delta-jump="bonds"]')?.click());
  await page.waitForTimeout(800);
  console.log(`[${phase}] dossier memories shown:`, await ev(() => { const h3 = [...document.querySelectorAll('h3')].find(n => /Important memories/.test(n.textContent)); return JSON.stringify([...(h3?.parentElement?.querySelectorAll('li') ?? [])].map(li => li.textContent.trim())); }));
  const box = await page.evaluateHandle(() => [...document.querySelectorAll('h3')].find(n => /Important memories/.test(n.textContent))?.closest('section, .delta-section, .delta-card') ?? [...document.querySelectorAll('h3')].find(n => /Important memories/.test(n.textContent))?.parentElement);
  const el = box.asElement();
  if (el) { await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: `${OUT}/elke-memories-${phase}.png` }); }
  await page.screenshot({ path: `${OUT}/elke-dossier-${phase}.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
