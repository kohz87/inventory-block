import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const Q = `${S}/mock/q`, LOG = `${S}/mock/log2`;
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
});
await page.waitForTimeout(4000);
const mode = process.argv[2] ?? 'done';
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await ev(async () => { const ctx = SillyTavern.getContext(); ctx.chat[0].is_system = true; ctx.chat[1].is_system = true; await ctx.saveChat(); await ctx.reloadCurrentChat(); });
await page.waitForTimeout(1500);
await h.turn(r3, 'We take the river path east to the weir.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
await h.click('^Fight'); await page.waitForTimeout(3000);
await h.click('^Start'); await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(800); }
console.log('result buttons:', await ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).join(', ')));
if (mode === 'done') console.log('clicked:', await h.click('^Done'));
await page.waitForTimeout(1500);
console.log('pending after:', await ev(() => JSON.stringify({ ...(SillyTavern.getContext().chatMetadata.rpgBattle?.pending ?? {}), handoff: undefined })));
for (const f of fs.readdirSync(LOG)) fs.unlinkSync(`${LOG}/${f}`);
fs.writeFileSync(`${Q}/1.txt`, 'You take the purses and go.');
await page.fill('#send_textarea', 'I quickly take their coin pouches and head to the apothecary.');
await page.click('#send_but');
for (let i = 0; i < 60 && !fs.readdirSync(LOG).some(f => f.startsWith('req')); i++) await page.waitForTimeout(500);
await page.waitForTimeout(3000);
const reqs = fs.readdirSync(LOG).filter(f => f.startsWith('req')).sort();
for (const f of reqs) {
  const all = JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8')).messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n');
  console.log(f, 'messages:', JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8')).messages.length, '· hand-off:', all.includes('[Battle resolved by RPG Battle'), '· narrating:', /This reply tells the fight above/.test(all));
}
// Delete the narration and the turn, send it again.
await page.waitForTimeout(1500);
const seen = new Set(fs.readdirSync(LOG));
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.deleteLastMessage(); await ctx.deleteLastMessage(); });
await page.waitForTimeout(1500);
fs.writeFileSync(`${Q}/2.txt`, 'You take the purses, again.');
await page.fill('#send_textarea', 'I quickly take their coin pouches and head to the apothecary.');
await page.click('#send_but');
for (let i = 0; i < 60 && !fs.readdirSync(LOG).some(f => f.startsWith('req') && !seen.has(f)); i++) await page.waitForTimeout(500);
await page.waitForTimeout(3000);
for (const f of fs.readdirSync(LOG).filter(f => f.startsWith('req') && !seen.has(f)).sort()) {
  const d = JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8'));
  const all = d.messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n');
  console.log('re-run', f, 'messages:', d.messages.length, '· hand-off:', all.includes('[Battle resolved by RPG Battle'));
}
console.log('pending now:', await ev(() => JSON.stringify({ ...(SillyTavern.getContext().chatMetadata.rpgBattle?.pending ?? {}), handoff: undefined })), '· chat length:', await ev(() => SillyTavern.getContext().chat.length));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
