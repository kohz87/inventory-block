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
const r4 = fs.readFileSync(`${S}/demo/r4.txt`, 'utf8').replace(/<XP>[\s\S]*?<\/XP>\n?/, '');
const at = (time, lines) => r4.replace('1203, March 3, 09:50 am', time).replace(/<Director>[\s\S]*?<\/Director>/, `<Director>\n${lines}\n</Director>`);
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await h.dock();
const reqs = () => fs.readdirSync(LOG).filter(f => /^req-\d+\.json$/.test(f)).map(f => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
const send = async (text, reply) => {
  const before = reqs().at(-1) ?? 0;
  fs.writeFileSync(`${Q}/1.txt`, reply);
  const n = await ev(() => SillyTavern.getContext().chat.length);
  await page.fill('#send_textarea', text);
  await page.click('#send_but');
  await page.waitForFunction(k => SillyTavern.getContext().chat.length >= k && /Director/.test(SillyTavern.getContext().chat.at(-1).mes), n + 2, { timeout: 60000 });
  await page.waitForTimeout(2500);
  // The reply's own request: the first logged after `before` that carries the chat.
  const mine = reqs().filter(k => k > before).map(k => JSON.parse(fs.readFileSync(`${LOG}/req-${k}.json`, 'utf8'))).find(r => Array.isArray(r.messages) && r.messages.some(m => /I head|I look/.test(m.content ?? '')));
  return mine;
};
const a = await send('I look around the square.', at('CY 611, Goldwane 12, 01:30 pm', '+ hook Lime Kiln Bats — clear the bats | giver: Elke | reward: 5 silver'));
const b = await send('I head for the kiln.', at('CY 611, Goldwane 12, 03:00 pm', '~ Lime Kiln Bats — now: at the kiln mouth'));
const flat = r => r.messages.map(m => `${m.role}:${m.content}`).join('\n\u0001');
const x = flat(a), y = flat(b);
let i = 0; while (i < x.length && i < y.length && x[i] === y[i]) i++;
const where = (r, needle) => r.messages.findIndex(m => (m.content ?? '').includes(needle));
console.log(JSON.stringify({ prefixChars: i, reply2Chars: y.length, prefixPct: Math.round(1000 * i / y.length) / 10,
  messages: b.messages.length, instructionAt: where(b, 'End your reply with one <Director>'), headerAt: where(b, '[Story Director'), lastUserAt: b.messages.map(m => m.role).lastIndexOf('user') }));
const sd = b.messages.map((m, k) => [k, m.role, (m.content ?? '').slice(0, 60)]).filter(([, , c]) => /End your reply with one <Director>|\[Story Director/.test(c)); console.log('sd parts:', JSON.stringify(sd), 'main at', b.messages.findIndex(m => m.role === 'system'));
console.log('diverges at:', JSON.stringify(y.slice(Math.max(0, i - 80), i + 80)));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
