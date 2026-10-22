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
  $('#stream_toggle').prop('checked', true).trigger('change');
  $('#api_button_openai').trigger('click');
  $('#oai_max_context_unlocked').prop('checked', true).trigger('input').trigger('change'); await new Promise(r => setTimeout(r, 300));
  $('#openai_max_context').val(120000).trigger('input'); $('#openai_max_context_counter').val(120000).trigger('input');
});
await page.waitForTimeout(4000);
const mode = process.argv[2] ?? 'done';
const r3 = fs.readFileSync(`${S}/demo/r3.txt`, 'utf8');
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
fs.writeFileSync(`${Q}/0.txt`, r3);
await page.fill('#send_textarea', 'We take the river path east to the weir.');
await page.click('#send_but');
await page.waitForFunction(() => /Encounter/.test(SillyTavern.getContext().chat.at(-1)?.mes ?? '') && !SillyTavern.getContext().chat.at(-1).is_user, null, { timeout: 60000 });
await page.waitForTimeout(5000);
console.log('origin reply date:', await ev(() => SillyTavern.getContext().chat.at(-1).send_date));
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
await h.click('^Fight'); await page.waitForTimeout(3000);
await h.click('^Start'); await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(800); }
console.log('result buttons:', await ev(() => [...document.querySelectorAll('.story-block-pane button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).join(', ')));
if (mode === 'done') console.log('clicked:', await h.click('^Done'));
await page.waitForTimeout(1500);
console.log('origin date now:', await ev(() => SillyTavern.getContext().chat.at(-1).send_date));
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
// The reply after the narration: dice are back.
fs.writeFileSync(`${Q}/2.txt`, 'You walk on.');
await page.waitForTimeout(2000);
await page.fill('#send_textarea', 'I walk on to the village.');
await page.click('#send_but');
await page.waitForTimeout(8000);
const seen = new Set(reqs);
for (const f of fs.readdirSync(LOG).filter(f => f.startsWith('req')).sort()) {
  const all = JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8')).messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n');
  console.log(seen.has(f) ? 'narration' : 'next', f, '· dice block:', all.includes('<Dice'), '· hand-off:', all.includes('[Battle resolved by RPG Battle'));
}
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
