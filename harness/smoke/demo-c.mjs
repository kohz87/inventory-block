import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const h = await open();
const { page, ev } = h;
const read = f => fs.readFileSync(`${S}/demo/${f}`, 'utf8');
await h.openNarrator('The Narrator - 2026-10-18@01h44m00s947ms');
await h.dock();
await h.tab('ext:rpg-party');
let text = await h.pane();
if (/Lyra joined/.test(text)) { await h.click('^Add as companion'); await page.waitForTimeout(5000); }
if (/NEW COMPANION/.test(await h.pane())) { console.log('add:', await h.click('^Add to the party')); await page.waitForTimeout(2500); }
console.log('party:', (await h.pane()).slice(0, 400));
console.log('r1 at', await h.turn(read('r1.txt'), 'I pay Mira her two coppers and head up the hill to the Warden\'s post with Lyra. I ask whoever is in charge about work.'));
await page.waitForTimeout(2500);
console.log('r2 at', await h.turn(read('r2.txt'), '"Six silver. I\'ll take it." I hold his eye. "But half of it now. We\'ll need bread and lamp oil before we go hunting your wolves."'));
await page.waitForTimeout(2500);
// NPC State Delta dossiers for the cast (a scan would write these; there is no model here).
console.log('nsd:', await ev(async () => {
  const base = '/scripts/extensions/third-party/npc_state_delta';
  const bundle = await import(`${base}/bundle.js`);
  const core = await import(`${base}/core-mechanics.js`);
  const bytes = await window.NPCStateDelta.exportBytes();
  const decoded = bundle.decodeNpcStateBundle(bytes);
  const state = decoded.state;
  const make = (name, fields) => Object.assign(core.createNpcRecord(name, state.npcs.map(n => n.id)), fields);
  const turn = Number(state.turn || 0);
  state.npcs = [
    make('Captain Kael', { role: 'Warden captain of Harrowford', gender: 'male', age: 'late forties', species: 'human', appearance: 'Broad, grey at the temples, a soldier\'s stoop; left arm in a sling.', personality: 'Blunt, proud, tired; fair to those who keep their word.', speech: 'Short sentences, no pleasantries, dry.', background: 'Twenty years in the Warden\'s service on the river frontier; broke his arm in a fall chasing a thief.', mood: 'Grudgingly grateful', status: 'Forearm reset by Lyra, aching', location: 'Warden\'s Post', goal: 'Get the weir pack killed before the spring lambs', present: true, lifeState: 'alive', lastSeenTurn: turn, seenCount: 2, relationshipSummary: 'Hired Ren for the weir bounty; owes Lyra for his arm.' }),
    make('Lyra', { role: 'Travelling healer', gender: 'female', age: 'early twenties', species: 'human', appearance: 'Slight, freckled, hooded green cloak, ink-stained fingers, a satchel of herbs and needles.', personality: 'Curious, careful, kind without being soft; frightened of large animals and pretends otherwise.', speech: 'Quiet, precise, the odd dry joke.', background: 'Apprenticed to a herbwife in Elmbridge; walks the river towns stitching up whoever pays.', mood: 'Satisfied, brisk', status: 'Rested', location: 'Warden\'s Post', goal: 'Earn enough this season to buy her own still', present: true, lifeState: 'alive', lastSeenTurn: turn, seenCount: 3, relationshipSummary: 'Shared the night crossing with Ren and joined the hunt.' }),
    make('Mira', { role: 'Ferry keeper', gender: 'female', age: 'sixties', species: 'human', appearance: 'Small and weathered, oilskin coat, rope-burned hands.', personality: 'Shrewd, unhurried, knows everyone\'s business.', speech: 'Plain river talk, counts coppers aloud.', background: 'Has run the Harrowford ferry for thirty years.', mood: 'Content', status: 'Well', location: 'Ferry landing', goal: 'Make the noon crossing to Elmbridge', present: false, lifeState: 'alive', lastSeenTurn: Math.max(0, turn - 2), seenCount: 1, relationshipSummary: 'Ferried Ren and Lyra across; sent Ren to the Warden.' }),
  ];
  const out = bundle.encodeNpcStateBundle(state, { appVersion: window.NPCStateDelta.version, chatKey: decoded.metadata?.sourceChatKey ?? '' });
  const ok = await window.NPCStateDelta.importBytes(out);
  window.NPCStateDelta.renderInline?.();
  return JSON.stringify({ ok, npcs: window.NPCStateDelta.getState().npcs.map(n => `${n.name}:${n.present}`) });
}));
await page.waitForTimeout(2000);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
