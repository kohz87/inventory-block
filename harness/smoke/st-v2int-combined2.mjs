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
page.on('response', r => { if (r.status() === 404) errors.push(`404 ${r.url()}`); });
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
    notice: document.querySelector('#story_suite_v2_bar .story-suite-notice')?.hidden === false ? document.querySelector('#story_suite_v2_bar .story-suite-notice-text').textContent : null,
    dialog: document.querySelector('.ss-dialog') ? `${document.querySelector('.ss-dialog-title')?.textContent} steps=${[...document.querySelectorAll('.ss-dialog-step')].map(n => n.textContent).join('/')}` : null,
}))), `requests sent=${reqs().length - before}`);
await page.screenshot({ path: `${SHOTS}/combined2-blocked.png` });
await ev(() => document.querySelector('.ss-dialog-close')?.click());
// The queued reply was not used; drop it.
for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`);
// The reader's message stays; remove it so the next send is clean.
await ev(async () => { const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });

// 2. A party created by command.
let made = await cmd('party.create', { name: 'Ren', points: { STR: 3, VIT: 3, AGI: 2, DEX: 2, INT: 0, LUK: 0, CHA: 0 } });
say('2. party.create:', JSON.stringify(made));
if (!made.ok) { made = await cmd('creation.finish', { name: 'Ren', points: {} }); say('   creation.finish:', JSON.stringify(made)); }
say('   party.pc:', JSON.stringify(await q('party.pc')).slice(0, 300));

// 3. A reply with a quest offer and an encounter offer.
const R1 = 'Hollis wrings his apron: rats have overrun his cellar, and he will pay thirty gold to whoever clears them. As he speaks, a swarm boils out of the bins.\n\n<Changes>\n~ place Bluewatch Village | kind: settlement\n+ present Hollis\n+ quest Cellar Rats — clear the rats from Hollis\'s cellar | giver: Hollis | goal: kill 2 cellar rats | reward: 30 gold\n! encounter 2 Cellar Rat — boiling out of the bins | tier: weak | stakes: normal\n</Changes>';
await send('I ask Hollis what is wrong.', R1);
const firstReq = reqs().at(-1);
say('3. reply captured:', await ev(() => { const m = SillyTavern.getContext().chat.at(-1); return `receipts=${(m.extra.storySuite?.receipts ?? []).map(r => r.type).join(',')}`; }));

const threads = await q('director.threads', {});
say('   quest threads:', JSON.stringify(threads)?.slice(0, 400));
const offers = await q('combat.offers');
say('   combat offers:', JSON.stringify(offers)?.slice(0, 300));
await page.click('.story-suite-bar-story');
await page.waitForTimeout(800);
say('   tabs:', await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab-label')].map(n => n.textContent).join(', ')));
for (const name of ['Quests', 'Fight', 'Party']) {
    await ev(n => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(b => b.textContent.trim().startsWith(n))?.click(), name);
    await page.waitForTimeout(700);
    say(`   ${name} tab:`, (await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-pane')?.innerText ?? '')).replace(/\s+/g, ' ').slice(0, 260));
    await page.screenshot({ path: `${SHOTS}/combined2-tab-${name.toLowerCase()}.png` });
}
await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());

// 4. Take the quest, fight, finish it.
const quest = Array.isArray(threads) ? threads.find(t => t.kind === 'quest') : Object.values(threads ?? {}).find(t => t?.kind === 'quest');
say('4. quest.take:', JSON.stringify(await cmd('quest.take', { id: quest?.id, key: 'Cellar Rats' })));
const offer = Array.isArray(offers) ? offers[0] : null;
say('   combat.start:', JSON.stringify(await cmd('combat.start', { offer: offer?.id })));
let session = await q('combat.session');
for (let i = 0; i < 60 && session && session.status === 'active'; i += 1) {
    const r = await cmd('combat.act', { action: { type: 'auto' } });
    if (!r.ok) { say('   combat.act refused:', JSON.stringify(r)); break; }
    session = await q('combat.session');
}
say('   fight status:', session?.status);
await page.click('.story-suite-bar-story'); await page.waitForTimeout(600);
await ev(() => [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(b => b.textContent.trim().startsWith('Fight'))?.click());
await page.waitForTimeout(700);
await page.screenshot({ path: `${SHOTS}/combined2-fight-over.png` });
await ev(() => document.querySelector('#story_suite_v2_panel .story-suite-sheet-close')?.click());
say('   combat.end:', JSON.stringify(await cmd('combat.end', {})));
say('   foesBeaten:', JSON.stringify(await q('combat.foesBeaten', { sinceRev: 0 })));
say('   quest.progress:', JSON.stringify(await q('quest.progress', { id: quest?.id })));
const walletBefore = await q('inventory.wallet', {});
const fin = await cmd('quest.finish', { id: quest?.id });
say('   quest.finish:', JSON.stringify(fin));
say('   wallet before/after:', JSON.stringify(walletBefore), JSON.stringify(await q('inventory.wallet', {})));

// 5. The next reply is told what happened; the static part stays the same.
await send('I count my coins.', 'You count the coins Hollis gave you.');
const lastReq = reqs().at(-1);
const body = req(lastReq);
const tail = body.messages.at(-1)?.content ?? '';
say(`5. ${lastReq} tail:`, JSON.stringify(String(tail).slice(0, 700)));
const staticOf = b => b.messages.filter(m => m.role === 'system').map(m => String(m.content)).find(t => t.includes('[Story Suite: how this story is kept]')) ?? '';
say('   static identical:', staticOf(req(firstReq)) === staticOf(body), `len=${staticOf(body).length}`);
const p = sharedPrefix(req(firstReq).messages, body.messages);
say(`   shared prefix ${firstReq} vs ${lastReq}: ${p.chars} chars, ${p.percent}%`);
await page.screenshot({ path: `${SHOTS}/combined2-chat.png` });

// 6. Swipe the last reply back to an empty state, delete the fight reply: rollback.
say('6. head before delete:', JSON.stringify({ rev: await ev(() => StoryBlock.sdk.view().state?.meta.rev), wallet: await q('inventory.wallet', {}) }));
await ev(async () => { const c = SillyTavern.getContext(); await c.deleteLastMessage(); await c.deleteLastMessage(); await c.deleteLastMessage(); await c.saveChat(); });
await page.waitForTimeout(1500);
say('   after deleting the last three messages:', JSON.stringify({ rev: await ev(() => StoryBlock.sdk.view().state?.meta.rev), wallet: await q('inventory.wallet', {}), quests: (Object.values((await q('director.threads', {})) ?? {}).length) }));

say('page errors/warnings:', errors.length ? `\n  ${errors.slice(0, 40).join('\n  ')}` : 'none');
fs.writeFileSync(`${SHOTS}/combined-results-2.txt`, out.join('\n'));
await browser.close();
