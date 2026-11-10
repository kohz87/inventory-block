import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const LOG = `${S}/mock/log`;
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
const read = f => fs.readFileSync(`${S}/demo/${f}`, 'utf8');
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
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
await h.turn(read('r3.txt'), 'We take the river path east to the weir.');
await page.waitForTimeout(3000);
await h.tab('ext:rpg-battle'); await page.waitForTimeout(800);
await h.click('^Fight'); await page.waitForTimeout(3000);
await h.click('^Start'); await page.waitForTimeout(1500);
for (let i = 0; i < 30; i++) { if (!(await h.click('^Auto'))) break; await page.waitForTimeout(800); }
for (const f of fs.readdirSync(LOG)) fs.unlinkSync(`${LOG}/${f}`);
// Back to the story: the narrating reply is generated (the mock answers).
console.log('return:', await h.click('^(Just continue|Return to story)'));
for (let i = 0; i < 40 && !fs.readdirSync(LOG).length; i++) await page.waitForTimeout(500);
await page.waitForTimeout(1500);
const file = fs.readdirSync(LOG).sort()[0];
const all = file ? JSON.parse(fs.readFileSync(`${LOG}/${file}`, 'utf8')).messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n') : '';
console.log('hand-off sent:', all.includes('[Battle resolved by RPG Battle'));
console.log('narrating instruction sent:', (all.match(/This reply tells the fight above[^\n]*/) ?? ['none'])[0]);
console.log('story instruction sent:', all.includes('Hidden blocks, only when the story makes them true'));
// Settings → Diagnostics.
const report = await ev(() => {
  const fold = document.querySelector('.rpg-battle-settings details[data-fold="diagnostics"]');
  if (!fold) return 'no fold';
  fold.open = true; fold.dispatchEvent(new Event('toggle'));
  return fold.querySelector('.rpg-battle-diagnostics').textContent;
});
console.log('--- diagnostics ---\n' + report);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
