import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
page.on('response', r => { if (r.status() === 404) errors.push('404 ' + r.url()); });
page.on('console', m => { if (m.type() === 'error' && !/dossier scan failed|status of 400/.test(m.text())) errors.push('console ' + m.text().slice(0, 240)); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && window.StorySuite, null, { timeout: 60000 });
await page.waitForTimeout(4000);
const ev = (fn, arg) => page.evaluate(fn, arg);
const paneText = () => ev(() => { const p = [...document.querySelectorAll('.story-block-pane')].find(n => n.style.display !== 'none'); return (p?.dataset.tabId ?? '') + ' :: ' + (p?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 700); });
const tabs = () => ev(() => [...document.querySelectorAll('.story-block-sidebar-tab')].map(t => t.dataset.tabId).join(','));
const clickTab = id => ev(i => document.querySelector(`.story-block-sidebar-tab[data-tab-id="${i}"]`)?.click(), id);
const clickButton = re => ev(src => { const r = new RegExp(src); const b = [...document.querySelectorAll('.story-block-pane button')].filter(n => n.offsetParent).find(n => r.test(n.textContent)); b?.click(); return b ? b.textContent.trim() : null; }, re.source);
await ev(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); await ctx.executeSlashCommandsWithOptions('/newchat'); });
await page.waitForTimeout(3000);
// Greeting with starting skills and a companion.
await ev(async () => {
  const ctx = SillyTavern.getContext();
  ctx.chat[0].mes += '\n<Learned>You — Shadow Step: dash behind a foe | type: physical, stat: AGI, target: one</Learned>\n<Joins>Lyra — healer, level 3 | focus: INT, VIT</Joins>';
  if (Array.isArray(ctx.chat[0].swipes)) ctx.chat[0].swipes[ctx.chat[0].swipe_id ?? 0] = ctx.chat[0].mes;
  await ctx.saveChat(); await ctx.reloadCurrentChat();
});
await page.waitForTimeout(3000);
console.log('greeting shows raw blocks:', await ev(() => /Learned|Joins|Shadow Step/.test(document.querySelector('#chat .mes[mesid="0"] .mes_text')?.innerText ?? '')));
const mode = await ev(() => document.querySelector('#story_block_sidebar')?.dataset.mode);
if (mode !== 'docked') { await page.locator('#story_block_handle').click().catch(() => {}); await page.waitForTimeout(500); }
console.log('tabs:', await tabs());
await clickTab('ext:rpg-party'); await page.waitForTimeout(500);
// Create: put 10 points into AGI/STR via + buttons.
for (let i = 0; i < 10; i++) { await page.locator(`.story-block-pane .rpg-battle-stepper[data-stat="${i % 2 ? 'STR' : 'AGI'}"] .is-plus`).first().click(); await page.waitForTimeout(80); }
await page.waitForTimeout(300);
console.log('create button:', await clickButton(/Create character/));
await page.waitForTimeout(2500);
console.log('party after create:', await paneText());
await page.screenshot({ path: `${S}/shots/r04-after-create.png` });
// Offers waiting after creation: accept the skill, then the companion.
console.log('offer buttons:', await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-tab button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).filter(Boolean).slice(0, 30)));
console.log('accept 1:', await clickButton(/^(Accept|Add|Learn)/)); await page.waitForTimeout(1500);
console.log('pane:', await paneText());
await page.screenshot({ path: `${S}/shots/r04-offer1.png` });
console.log('form values:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-tab input, .story-block-pane .rpg-battle-tab select')].filter(n => n.offsetParent).map(n => `${n.className.split(' ').pop()}=${n.type === 'checkbox' ? n.checked : n.value}`))));
console.log('companion skills:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-section.is-companion-skills')].map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 300)))));
await page.waitForTimeout(31000);
console.log('companion skills later:', JSON.stringify(await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-section.is-companion-skills')].map(n => n.innerText.replace(/\s+/g, ' ').slice(0, 300)))));
console.log('add companion:', await clickButton(/^Add (companion|to the party|Lyra)/)); await page.waitForTimeout(2000);
console.log('accept skill:', await clickButton(/^Add it/)); await page.waitForTimeout(1500);
console.log('pane now:', (await paneText()).slice(0, 400));
console.log('learn buttons:', await ev(() => [...document.querySelectorAll('.story-block-pane .rpg-battle-tab button')].filter(b => b.offsetParent).map(b => b.textContent.trim()).filter(Boolean).slice(0, 20)));
await page.screenshot({ path: `${S}/shots/r04-learn.png` });
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
