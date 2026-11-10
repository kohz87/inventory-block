// Combined live check: Story Block v2-int + RPG Battle, Story Director, NPC State Delta (origin/v2) in
// SillyTavern 1.19 with the mock model.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { sharedPrefix } from '/home/user/_live/story_block/testkit/fake-st.js';

const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const { ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG } = process.env;
const SHOTS = `${SP}/uiux/v2`;
const out = [];
const say = (...a) => { const line = a.join(' '); out.push(line); console.log(line); };
let qn = 0;
const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now())}-${String(++qn).padStart(3, '0')}.txt`, text);
const reqs = () => fs.readdirSync(MOCK_LOG).filter(f => /^req-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
const req = name => JSON.parse(fs.readFileSync(`${MOCK_LOG}/${name}`, 'utf8'));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror ${e.message}`));
page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(`console.${m.type()} ${m.text().slice(0, 400)}`); });
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 90000 });
await page.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);
const ev = (fn, a) => page.evaluate(fn, a);
say('modules:', await ev(() => StoryBlock.sdk.modules().map(m => `${m.id}@${m.version}`).join(', ')));
say('drawer lines:', await ev(() => [...document.querySelectorAll('.rpg-battle-needs-story-block, [class*="needs-story-block"]')].map(n => n.textContent).join(' | ') || 'none'));

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
    await new Promise(r => setTimeout(r, 3000));
}, MOCK_URL);
say('fresh chat:', await ev(() => { const c = SillyTavern.getContext(); return `${c.getCurrentChatId()} messages=${c.chat.length} domains=${Object.keys(StoryBlock.sdk.view().state?.domains ?? {}).join(',')}`; }));

async function send(text, reply) {
    if (reply !== null) queue(reply);
    const before = await ev(() => SillyTavern.getContext().chat.length);
    await page.fill('#send_textarea', text);
    await page.click('#send_but');
    await page.waitForFunction(n => { const c = SillyTavern.getContext().chat; return c.length >= n + 2 && !c.at(-1).is_user && c.at(-1).mes; }, before, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
}
const cmd = (type, payload) => ev(async ([t, p]) => { const r = await StoryBlock.sdk.command(t, p); return r.ok ? { ok: true, summary: r.receipt.summary, data: r.receipt.data } : { ok: false, code: r.code, message: r.message }; }, [type, payload]);
const q = (name, args) => ev(([n, a]) => { try { return StoryBlock.sdk.query(n, a); } catch (e) { return `ERR ${e.message}`; } }, [name, args]);

// 1. No character: the story generation is held back, the notice shows, the wizard opens.
const before = reqs().length;
await send('I wake up in the inn.', 'You wake to the smell of bread.');
say('1. blocked:', JSON.stringify(await ev(() => ({
    messages: SillyTavern.getContext().chat.length,
    notice: document.querySelector('.story-suite-notice')?.hidden === false ? document.querySelector('.story-suite-notice-text').textContent : null,
    dialog: document.querySelector('.ss-dialog') ? `${document.querySelector('.ss-dialog-title')?.textContent} steps=${[...document.querySelectorAll('.ss-dialog-step')].map(n => n.textContent).join('/')}` : null,
}))), `requests sent=${reqs().length - before}`);
await page.screenshot({ path: `${SHOTS}/combined-blocked-wizard.png` });
await ev(() => document.querySelector('.ss-dialog-close')?.click());
// The queued reply was not used; drop it.
for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`);
// The reader's message stays; remove it so the next send is clean.
await ev(async () => { const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });

say('console:', errors.join('\n  '));
await browser.close();
