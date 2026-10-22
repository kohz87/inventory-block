// Live check, Story Block v2 alone (v2-int) in SillyTavern 1.19 with the mock model.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { sharedPrefix } from '/home/user/_live/story_block/testkit/fake-st.js';

const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const { ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG } = process.env;
const SHOTS = `${SP}/uiux/v2`;
fs.mkdirSync(SHOTS, { recursive: true });
const out = [];
const say = (...a) => { const line = a.join(' '); out.push(line); console.log(line); };
let qn = 0;
const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now())}-${String(++qn).padStart(3, '0')}.txt`, text);
const lastReq = () => {
    const files = fs.readdirSync(MOCK_LOG).filter(f => /^req-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    return files.length ? { name: files.at(-1), body: JSON.parse(fs.readFileSync(`${MOCK_LOG}/${files.at(-1)}`, 'utf8')) } : null;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror ${e.message}`));
page.on('console', m => { if (m.type() === 'error' || /Story Block v2|Story Suite/.test(m.text())) errors.push(`console.${m.type()} ${m.text().slice(0, 300)}`); });
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
await page.waitForTimeout(2500);
const ev = (fn, a) => page.evaluate(fn, a);

say('host:', await ev(() => `${StoryBlock.version} modules=${StoryBlock.sdk.modules().map(m => m.id).join(',')} interceptor=${typeof window.storyBlockGenerationInterceptor}`));
await ev(async url => {
    const $ = window.jQuery;
    $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 500));
    $('#custom_api_url_text').val(url).trigger('input');
    $('#custom_model_id').val('mock-model').trigger('input');
    $('#stream_toggle').prop('checked', false).trigger('change');
    $('#api_button_openai').trigger('click');
    await new Promise(r => setTimeout(r, 3000));
    const ctx = SillyTavern.getContext();
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
    await new Promise(r => setTimeout(r, 2000));
    await ctx.executeSlashCommandsWithOptions('/newchat');
    await new Promise(r => setTimeout(r, 2500));
}, MOCK_URL);
say('fresh chat:', await ev(() => { const c = SillyTavern.getContext(); return `${c.getCurrentChatId()} messages=${c.chat.length} greetingRecord=${!!c.chat[0]?.extra?.storySuite?.checkpoint}`; }));

async function send(text, reply) {
    if (reply !== null) queue(reply);
    const before = await ev(() => SillyTavern.getContext().chat.length);
    await page.fill('#send_textarea', text);
    await page.click('#send_but');
    await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes; }, before, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
}
const head = () => ev(() => {
    const sdk = StoryBlock.sdk;
    const items = sdk.query('inventory.items', {}).map(i => `${i.name}×${i.qty}`).join(', ');
    const s = sdk.view().state;
    return `rev=${s.meta.rev} items=[${items}] wallet=${s.domains.inventory.wallets.party?.coin ?? 0} place=${s.domains.scene.place.name || '-'} present=[${s.domains.scene.present.join(',')}]`;
});

// 1. A reply with a <Changes> block.
const REPLY1 = 'The ferryman hands you a coil of rope and three coins, then poles you across to Bluewatch, where Fenna waits at the gate.\n\n<Changes>\n+ item Rope | qty: 2 | note: tarred hemp\n+ item Lantern\n+ coin 30 | from: the ferryman\n~ place Bluewatch Village | kind: settlement | region: the Lowmere\n+ present Fenna\n</Changes>';
await send('I pay the ferryman and cross the river.', REPLY1);
const req1 = lastReq();
say('reply 1 head:', await head());
say('hidden block:', await ev(() => {
    const c = SillyTavern.getContext(); const m = c.chat.at(-1);
    const shown = document.querySelector(`.mes[mesid="${c.chat.length - 1}"] .mes_text`)?.innerText ?? '';
    return `stored mes hidden=${/<!-- STORY_SUITE_V2/.test(m.mes)} shown has <Changes>=${/Changes|\+ item/.test(shown)} receipts=${m.extra.storySuite.receipts.length}`;
}));
say('problems:', await ev(() => JSON.stringify(window.StoryBlock && [])));

// 2. The panel: Inventory and Scene tabs; a desktop screenshot.
await page.click('.story-suite-bar-story');
await page.waitForTimeout(800);
say('tabs:', await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab-label')].map(n => n.textContent).join(', ')));
say('inventory tab:', (await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-pane').innerText)).replace(/\s+/g, ' ').slice(0, 300));
await page.screenshot({ path: `${SHOTS}/desktop-inventory.png` });
await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(n => /Scene/.test(n.textContent))?.click());
await page.waitForTimeout(600);
say('scene tab:', (await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-pane').innerText)).replace(/\s+/g, ' ').slice(0, 300));
await page.screenshot({ path: `${SHOTS}/desktop-scene.png` });
await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
// The changes card under the reply.
say('card under reply:', await ev(() => { const c = SillyTavern.getContext(); const el = document.querySelector(`.mes[mesid="${c.chat.length - 1}"] .ss-card`); return el ? el.innerText.replace(/\s+/g, ' ') : 'none'; }));
await page.screenshot({ path: `${SHOTS}/desktop-chat-card.png` });

// 3. A click (a ui receipt, narrated) between replies, then the next request carries [Happened].
const drop = await ev(async () => {
    const lantern = StoryBlock.sdk.query('inventory.items', {}).find(i => i.name === 'Lantern');
    const r = await StoryBlock.sdk.command('inventory.drop', { stack: lantern.stack });
    return `${r.ok} ${r.receipt?.summary ?? r.message}`;
});
say('ui drop:', drop);
await send('I look around the village.', 'Thatched roofs, a mill wheel, and the smell of bread.');
const req2 = lastReq();
const sys = body => body.messages.filter(m => m.role === 'system').map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)));
const tail2 = req2.body.messages.at(-1)?.content ?? '';
say(`request ${req2.name}: last message role=${req2.body.messages.at(-1)?.role}`);
say('tail:', JSON.stringify(String(tail2).slice(0, 400)));
say('has [Happened] + drop:', /\[Happened\][\s\S]*Lantern/.test(JSON.stringify(req2.body.messages)));
const staticOf = body => sys(body).find(t => t.includes('[Story Suite: how this story is kept]')) ?? '';
say('static identical across two requests:', staticOf(req1.body) === staticOf(req2.body), `len=${staticOf(req1.body).length}`);
const p = sharedPrefix(req1.body.messages, req2.body.messages);
say(`shared prefix ${req1.name} vs ${req2.name}: ${p.chars} chars, ${p.percent}%`);
say('history has no <Changes>:', !JSON.stringify(req2.body.messages).includes('<Changes>\\n+ item Rope'));

// 4. Swipe the last reply with another ending; swipe back; delete.
const before = await head();
queue('The village is quiet. A stray dog follows you.\n\n<Changes>\n+ item Bread | qty: 1\n- present Fenna\n</Changes>');
await ev(async () => { await SillyTavern.getContext().swipe.right(); });
await page.waitForFunction(() => /stray dog/.test(SillyTavern.getContext().chat.at(-1).mes), null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
say('after swipe right:', await head());
await ev(async () => { await SillyTavern.getContext().swipe.left(); });
await page.waitForTimeout(1500);
say('after swipe back:', await head(), '| expected', before);
await ev(async () => { await SillyTavern.getContext().deleteLastMessage(); });
await page.waitForTimeout(1500);
say('after deleting the last reply:', await head());
await ev(async () => { await SillyTavern.getContext().deleteLastMessage(); await SillyTavern.getContext().deleteLastMessage(); });
await page.waitForTimeout(1500);
say('after deleting reply 1 and its message:', await head());

// 5. Save (SillyTavern's deleteLastMessage leaves saving to its caller), reload from disk: rebuilt from what was saved.
await ev(async () => { await SillyTavern.getContext().saveChat(); await SillyTavern.getContext().reloadCurrentChat(); });
await page.waitForTimeout(2500);
say('after save + reload:', await head(), `messages=${await ev(() => SillyTavern.getContext().chat.length)}`);

// 6. Settings overlay, game view screenshots.
await page.click('.story-suite-bar-settings');
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/desktop-settings.png` });
await ev(() => document.querySelector('.story-suite-close')?.click());
await send('I cross again.', REPLY1);
await ev(() => document.querySelector('.story-suite-bar-game')?.click());
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/desktop-gameview-home.png` });
await ev(() => document.querySelector('.ss-gameview-navitem[data-ss-target="story-block/inventory"]')?.click());
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS}/desktop-gameview-inventory.png` });
await ev(() => document.querySelector('.ss-gameview-close')?.click());

// 7. Mobile 390.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
mobile.on('pageerror', e => errors.push(`mobile pageerror ${e.message}`));
await mobile.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await mobile.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
await mobile.waitForTimeout(2500);
const chatId = await ev(() => SillyTavern.getContext().getCurrentChatId());
await mobile.evaluate(async id => {
    const ctx = SillyTavern.getContext();
    await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
    await new Promise(r => setTimeout(r, 2000));
    await ctx.openCharacterChat(id);
    await new Promise(r => setTimeout(r, 2500));
}, chatId);
await mobile.screenshot({ path: `${SHOTS}/mobile-chat.png` });
await mobile.tap('.story-suite-bar-story').catch(() => mobile.click('.story-suite-bar-story'));
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: `${SHOTS}/mobile-panel-inventory.png` });
say('mobile horizontal overflow:', await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
await mobile.evaluate(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
await mobile.evaluate(() => document.querySelector('.story-suite-bar-game')?.click());
await mobile.waitForTimeout(800);
await mobile.screenshot({ path: `${SHOTS}/mobile-gameview.png` });

say('page errors:', errors.length ? `\n  ${errors.join('\n  ')}` : 'none');
fs.writeFileSync(`${SHOTS}/alone-results.txt`, out.join('\n'));
await browser.close();
