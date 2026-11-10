import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const Q = process.env.MOCK_Q, LOG = process.env.MOCK_LOG;
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
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '');
const setMain = on => ev(v => {
  const s = SillyTavern.getContext().chatCompletionSettings;
  // Off: the Main Prompt taken out of every prompt order (kept aside to put back).
  window.__savedMain = window.__savedMain ?? {};
  (s.prompt_order ?? []).forEach((entry, k) => {
    const at = (entry.order ?? []).findIndex(i => i.identifier === 'main');
    if (!v && at >= 0) { window.__savedMain[k] = { at, item: entry.order[at] }; entry.order.splice(at, 1); }
    if (v && at < 0 && window.__savedMain[k]) { entry.order.splice(window.__savedMain[k].at, 0, window.__savedMain[k].item); }
  });
  return (s.prompt_order ?? []).map(e => (e.order ?? []).some(i => i.identifier === 'main'));
}, on);
const newest = () => fs.readdirSync(LOG).filter(f => /^req-\d+\.json$/.test(f)).sort((a, b) => Number(b.match(/\d+/)[0]) - Number(a.match(/\d+/)[0]))[0];
const send = async (text) => {
  const before = newest();
  fs.writeFileSync(`${Q}/1.txt`, r4);
  const n = await ev(() => SillyTavern.getContext().chat.length);
  await page.fill('#send_textarea', text);
  await page.click('#send_but');
  await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k, n + 2, { timeout: 60000 });
  await page.waitForTimeout(2500);
  const files = fs.readdirSync(LOG).filter(f => /^req-\d+\.json$/.test(f)).map(f => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
  const after = files.filter(k => !before || k > Number(before.match(/\d+/)[0]));
  // The reply's own request: the one carrying the reader's message.
  for (const k of after) {
    const req = JSON.parse(fs.readFileSync(`${LOG}/req-${k}.json`, 'utf8'));
    const msgs = req.messages ?? req.body?.messages ?? [];
    if (msgs.some(m => String(m.content ?? '').includes(text))) return msgs;
  }
  return [];
};
const report = (label, msgs) => {
  const hits = msgs.map((m, i) => [i, m.role, String(m.content ?? '')]).filter(([, , c]) => c.includes('Hidden blocks, only when the story makes them true'));
  const mainAt = msgs.findIndex(m => /Write .*next reply|Main Prompt|roleplay/i.test(String(m.content ?? '')));
  console.log(`${label}: ${msgs.length} messages; instruction in ${hits.length} message(s) at ${hits.map(([i, r]) => `#${i} (${r})`).join(', ') || 'none'}; occurrences in all text: ${(JSON.stringify(msgs).match(/Hidden blocks, only when the story makes them true/g) ?? []).length}`);
};
console.log('main prompt on:', JSON.stringify(await setMain(true)));
report('Main Prompt ON', await send('I look around the square.'));
console.log('main prompt off:', JSON.stringify(await setMain(false)));
report('Main Prompt OFF', await send('I walk to the well.'));
console.log('restored:', JSON.stringify(await setMain(true)));
await ev(() => SillyTavern.getContext().saveSettingsDebounced?.());
await page.waitForTimeout(3000);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
