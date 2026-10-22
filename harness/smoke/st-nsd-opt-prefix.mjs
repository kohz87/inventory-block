// Two consecutive real replies through this instance's mock; how much of the request is an identical prefix.
import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const Q = process.env.MOCK_Q, LOG = process.env.MOCK_LOG;
const CHAT = process.env.CHAT || 'The Narrator - 2026-10-18@09h00m00s000ms';
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await ev(async url => {
  const $ = window.jQuery;
  $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 500));
  $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 500));
  $('#custom_api_url_text').val(url).trigger('input');
  $('#custom_model_id').val('mock-model').trigger('input');
  $('#stream_toggle').prop('checked', false).trigger('change');
  $('#api_button_openai').trigger('click');
}, process.env.MOCK_URL);
await page.waitForTimeout(4000);
console.log('opened'); await h.openNarrator(CHAT); console.log('chat', await ev(() => SillyTavern.getContext().chat.length));
await ev(() => { const s = SillyTavern.getContext().extensionSettings.npc_state_delta; Object.assign(s, { enabled: true, inject: true, autoScan: true, narrationCapture: true, fullScanEveryTurn: false }); });
const base = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
const block = JSON.stringify({ npcs: [{ name: 'Lyra', present: true, mood: 'wary', relationshipImpact: 'none', relationshipDelta: { trust: 0, affection: 0, desire: 0, tension: 0 } }], relationshipsCovered: true });
const mains = [];
for (const [i, text] of ['Lyra, what do you see?', 'We wait by the weir until dusk.'].entries()) {
  const before = new Set(fs.readdirSync(LOG));
  fs.writeFileSync(`${Q}/1.txt`, `${base.replace('The pack', i ? 'Dusk falls. The pack' : 'The pack')}\n\n<!--npc_state_delta\n${block}\n-->`);
  const n = await ev(() => SillyTavern.getContext().chat.length);
  await page.fill('#send_textarea', text);
  await page.click('#send_but');
  await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k, n + 2, { timeout: 60000 });
  await page.waitForTimeout(3500);
  const fresh = fs.readdirSync(LOG).filter(f => !before.has(f) && /^req-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)) - Number(b.match(/\d+/)));
  const main = fresh.map(f => JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8'))).find(r => (r.messages || []).length >= 4);
  console.log('turn', i + 1, 'requests', fresh.length); mains.push(main);
}
const where = (msgs, re) => msgs.findIndex(m => re.test(String(m.content)));
for (const [i, req] of mains.entries()) {
  const msgs = req.messages;
  const rules = where(msgs, /NPC STATE DELTA ONE-PASS CAPTURE\. Write/);
  const tail = where(msgs, /Identity index \(matching only\)/);
  const lastUser = msgs.map(m => m.role).lastIndexOf('user');
  console.log(`request ${i + 1}: ${msgs.length} messages; capture rules at #${rules}; capture context at #${tail}; last user #${lastUser}; total chars ${JSON.stringify(msgs).length}`);
}
const a = JSON.stringify(mains[0].messages), b = JSON.stringify(mains[1].messages);
let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k += 1;
console.log(`identical prefix: ${k} of ${b.length} chars (${(100 * k / b.length).toFixed(1)}% of request 2)`);
console.log(`diverges at: …${b.slice(Math.max(0, k - 80), k).replace(/\\n/g, ' ')}⟂${b.slice(k, k + 80).replace(/\\n/g, ' ')}…`);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
