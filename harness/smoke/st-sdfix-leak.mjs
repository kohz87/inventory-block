import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const Q = process.env.MOCK_Q, LOG = process.env.MOCK_LOG;
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
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
console.log('SD version:', await ev(() => window.StoryDirector?.version));
const setMain = on => ev(v => {
  const s = SillyTavern.getContext().chatCompletionSettings;
  window.__savedMain = window.__savedMain ?? {};
  (s.prompt_order ?? []).forEach((entry, k) => {
    const at = (entry.order ?? []).findIndex(i => i.identifier === 'main');
    if (!v && at >= 0) { window.__savedMain[k] = { at, item: entry.order[at] }; entry.order.splice(at, 1); }
    if (v && at < 0 && window.__savedMain[k]) { entry.order.splice(window.__savedMain[k].at, 0, window.__savedMain[k].item); }
  });
  return (s.prompt_order ?? []).map(e => (e.order ?? []).some(i => i.identifier === 'main'));
}, on);
const reqs = () => fs.readdirSync(LOG).filter(f => /^req-\d+\.json$/.test(f)).map(f => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
const after = k => reqs().filter(n => n > k).map(n => JSON.parse(fs.readFileSync(`${LOG}/req-${n}.json`, 'utf8')));
const count = (r, needle) => (r.messages ?? []).filter(m => String(m.content ?? '').includes(needle)).length;
const INS = 'End your reply with one <Director>';
const HEAD = '[Story Director';
const raw = () => ev(() => SillyTavern.getContext().generateRaw({ systemPrompt: 'You extract NPC dossiers as JSON.', prompt: 'Transcript: Elke stamps the slip.' }).catch(e => String(e)));
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '');
for (const mainOn of [false, true]) {
  console.log(`--- Main Prompt ${mainOn ? 'in the order' : 'missing from the order'}:`, JSON.stringify(await setMain(mainOn)));
  // A generation in progress: the note is out (as between the interceptor and the reply).
  let mark = reqs().at(-1) ?? 0;
  await ev(async () => { const c = SillyTavern.getContext(); await window.storyDirectorInterceptor(c.chat, 8000, () => {}, 'normal'); });
  await raw();
  const during = after(mark).at(-1);
  console.log('scan during the generation: instruction', count(during, INS), '· note', count(during, HEAD), '· messages', during.messages.length);
  // Close that window as a stopped generation would.
  await ev(async () => { const c = SillyTavern.getContext(); await c.eventSource.emit(c.eventTypes.GENERATION_STOPPED); });
  // The reply's own request.
  mark = reqs().at(-1) ?? 0;
  fs.writeFileSync(`${Q}/1.txt`, r4);
  const n = await ev(() => SillyTavern.getContext().chat.length);
  await page.fill('#send_textarea', `I look around (${mainOn ? 'on' : 'off'}).`);
  await page.click('#send_but');
  await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k && !SillyTavern.getContext().chat.at(-1).is_user, n + 2, { timeout: 60000 });
  await page.waitForTimeout(2500);
  const mine = after(mark).find(r => (r.messages ?? []).some(m => /I look around/.test(m.content ?? '')));
  console.log('reply\'s own request: instruction', count(mine, INS), '· note', count(mine, HEAD));
  mark = reqs().at(-1) ?? 0;
  await raw();
  const later = after(mark).at(-1);
  console.log('scan after the reply: instruction', count(later, INS), '· note', count(later, HEAD));
}
await setMain(true);
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
