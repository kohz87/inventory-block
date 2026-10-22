// Two real replies through the mock; how much of the two prompts is an identical start.
import { open } from './demo-common.mjs';
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
await page.waitForTimeout(3000);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await ev(() => {
  const c = SillyTavern.getContext();
  for (const b of c.extensionSettings.storyBlock.blocks) if (['inventory', 'dice'].includes(b.template)) b.enabled = true;
  c.saveSettingsDebounced();
});
await page.waitForTimeout(800);
const reply = (story, lines) => `${story}\n\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<Inventory_Changes>\n${lines}\n</Inventory_Changes>\n</Blocks>\n-->`;
const before = new Set(fs.readdirSync(LOG));
const send = async (text, body, n) => {
  fs.writeFileSync(`${Q}/1.txt`, body);
  await page.fill('#send_textarea', text);
  await page.click('#send_but');
  await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k && !SillyTavern.getContext().chat.at(-1).is_user, n, { timeout: 60000 });
  await page.waitForTimeout(2500);
};
console.log('ready');
const n0 = await ev(() => SillyTavern.getContext().chat.length);
await send('I climb down into the cellar.', reply('The rats scatter.', '[Loot]\n+ Rat Tail | 2'), n0 + 2);
await send('I search the corners.', reply('A rusted key glints.', '+ Rusted Key | 1'), n0 + 4);
const reqs = fs.readdirSync(LOG).filter(f => /^req-\d+\.json$/.test(f) && !before.has(f))
  .sort((a, b) => Number(a.match(/\d+/)) - Number(b.match(/\d+/)))
  .map(f => JSON.parse(fs.readFileSync(`${LOG}/${f}`, 'utf8')))
  .filter(j => JSON.stringify(j.messages ?? []).includes('STORY_BLOCKS_V1_CONTEXT_BEGIN'));
const [a, b] = reqs.slice(-2).map(j => JSON.stringify(j.messages));
let same = 0;
while (same < a.length && a[same] === b[same]) same += 1;
const where = (s, mark) => s.indexOf(mark);
const staticOf = s => { const i = s.indexOf('STORY_BLOCKS_V1_CONTEXT_BEGIN'); return s.slice(i, s.indexOf('STORY_BLOCKS_V1_CONTEXT_END', i)); };
console.log(JSON.stringify({
  requests: reqs.length,
  firstLen: a.length, secondLen: b.length,
  identicalStart: same, percentOfSecond: Math.round(1000 * same / b.length) / 10,
  contextBeginAt: where(b, 'STORY_BLOCKS_V1_CONTEXT_BEGIN'), stateBeginAt: where(b, 'STORY_BLOCKS_V1_STATE_BEGIN'),
  staticIdentical: staticOf(a) === staticOf(b),
  lastUserMessageAt: b.lastIndexOf('I search the corners'),
}));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
