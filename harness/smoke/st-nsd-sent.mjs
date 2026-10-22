import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const Q = `${S}/mock/q`;
const LOG = `${S}/mock/log2`;
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
});
await page.waitForTimeout(4000);
await h.openNarrator('The Narrator - 2026-10-18@14h00m00s000ms');
await h.dock();
await h.tab('ext:npc-state-delta-cast'); await page.waitForTimeout(800);
console.log('present tab:', (await h.pane()).slice(0, 260));
console.log('present buttons:', await ev(() => [...document.querySelectorAll('[data-npc-state-delta-action]')].filter(b => b.offsetParent).map(b => b.textContent.trim()).join(' | ')));
await h.tab('ext:npc-state-delta-dossiers'); await page.waitForTimeout(800);
console.log('dossiers tab:', (await h.pane()).slice(0, 260));
const preview = await ev(() => { const p = globalThis.StorySuite?.api?.('npc-state-delta')?.manage?.preview?.(); return p ? JSON.stringify({ label: p.label, parts: p.parts.map(x => [x.label, x.tokens, x.text.slice(0, 60)]) }) : 'no preview api'; });
console.log('manage.preview():', preview);
// The panel fold.
const fold = await ev(async () => { const d = document.querySelector('[data-delta-settings-group="sent"]'); if (!d) return 'no fold'; d.open = true; d.dispatchEvent(new Event('toggle')); await new Promise(r => setTimeout(r, 300)); return [...d.querySelectorAll('.delta-whats-sent-head, .delta-whats-sent-empty')].map(n => n.textContent).join(' / '); });
console.log("What's sent fold:", fold);
// A real reply through the mock: where does the reminder sit?
const before = new Set(fs.readdirSync(LOG));
const reply = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8').replace(/<Encounter>[\s\S]*?<\/Encounter>/, '');
fs.writeFileSync(`${Q}/1.txt`, reply);
const n = await ev(() => SillyTavern.getContext().chat.length);
await page.fill('#send_textarea', 'Lyra, what do you see?');
await page.click('#send_but');
await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k, n + 2, { timeout: 60000 });
await page.waitForTimeout(2500);
const fresh = fs.readdirSync(LOG).filter(f => !before.has(f) && /^req-\d+\.json$/.test(f));
for (const f of fresh) {
  const req = JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8'));
  const msgs = req.messages || req.body?.messages || [];
  const at = msgs.findIndex(m => /npc_state_delta/.test(String(m.content)) && /One-pass|hidden block|<!--npc_state_delta/i.test(String(m.content)));
  if (at < 0) continue;
  const lastUser = msgs.map(m => m.role).lastIndexOf('user');
  console.log(`${f}: ${msgs.length} messages; capture reminder at #${at} (${msgs[at].role}); last user at #${lastUser}; reminder is last: ${at === msgs.length - 1}`);
}
console.log('reply got mock text:', await ev(() => /Short Sword/.test(SillyTavern.getContext().chat.at(-1).mes)));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
