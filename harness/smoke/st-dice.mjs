import { open, S } from './demo-common.mjs';
import fs from 'node:fs';
const LOG = `${S}/mock/log`;
const h = await open({ width: 1440, height: 1000 });
const { page, ev } = h;
await ev(async () => {
  const $ = window.jQuery;
  $('#main_api').val('openai').trigger('change');
  await new Promise(r => setTimeout(r, 500));
  $('#chat_completion_source').val('custom').trigger('change');
  await new Promise(r => setTimeout(r, 500));
  $('#custom_api_url_text').val((window.__MOCK_URL || 'http://127.0.0.1:5099/v1')).trigger('input');
  $('#custom_model_id').val('mock-model').trigger('input');
  $('#stream_toggle').prop('checked', false).trigger('change');
  $('#api_button_openai').trigger('click');
});
await page.waitForTimeout(4000);
console.log('online:', await ev(() => SillyTavern.getContext().onlineStatus));
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
await ev(() => { const s = SillyTavern.getContext().extensionSettings.storyBlock; for (const b of s.blocks) if (b.id === 'dice-everyone') b.enabled = true; for (const b of s.blocks) if (b.id === 'dice') b.enabled = false; });
// The reply as pasted: the 13 used, the 2 skipped.
await ev(async () => {
  const ctx = SillyTavern.getContext();
  const mes = 'Wessel haggles at the village yard and wheels a handcart out.\n<!-- STORY_BLOCKS_V1\n<Blocks>\n<Dice_All rolls="2, 13, 18, 16, 1, 6">\n🎲 Wessel rents a handcart from the village yard — d20 vs DC 10 → 13 · success\n</Dice_All>\n</Blocks>\n-->';
  ctx.chat.push({ name: ctx.name1, is_user: true, is_system: false, send_date: new Date().toISOString(), mes: 'Rent a cart.', extra: {} });
  ctx.chat.push({ name: 'The Narrator', is_user: false, is_system: false, send_date: new Date().toISOString(), mes, swipes: [mes], swipe_id: 0, extra: {} });
  await ctx.saveChat(); await ctx.reloadCurrentChat();
});
await page.waitForTimeout(2500);
await h.dock();
const tab = await ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).find(id => /dice/i.test(id)));
await h.tab(tab);
console.log('card:', await ev(() => { const c = document.querySelector('.story-block-dice-card'); return c ? { outcome: c.dataset.outcome, story: c.dataset.storyOutcome, truth: c.querySelector('.story-block-dice-true')?.textContent, pill: c.querySelector('.story-block-dice-pill')?.textContent } : null; }));
await page.screenshot({ path: `${S}/shots/sb-dice-truth.png`, clip: { x: 1090, y: 40, width: 350, height: 600 } });
// A real request: what the model is handed.
await ev(async () => { const t = document.querySelector('#send_textarea'); t.value = 'I push the cart toward the weir.'; t.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#send_but').click(); });
for (let i = 0; i < 40 && !fs.readdirSync(LOG).length; i++) await page.waitForTimeout(500);
const file = fs.readdirSync(LOG).sort()[0];
const all = file ? JSON.parse(fs.readFileSync(`${LOG}/${file}`, 'utf8')).messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n') : '';
console.log('handed:', (all.match(/This reply's rolls, in order: [^\n]*/) ?? ['none'])[0].slice(0, 200));
console.log('errors:', h.errors.join('\n') || 'none');
await h.browser.close();
