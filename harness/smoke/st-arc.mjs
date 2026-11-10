import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const PLAN = `<think>The bullion, the warrants, the council.</think>
<plan>
ARC: The Weir Bullion — who sold the weir route, and the Council vote it decides
BEAT: Council session opens — the legation forces a vote | on: in 2 days | place: Auvoth
BEAT: Kade presents the corrupted core — the core fails before the Council | on: Haywane 15, 09:00 am | after: Council session opens
AGENDA: Senior Listener Geva — now: Bailiff Court | then: reissues the stable warrants | on: tomorrow at dawn
HOOK: River stranger — who pulled Ren from the sump; finding him settles the debt | then: he sends word | on: Haywane 15
CLOCK: Hollin's Reach graves — the washed graves stay unfinished → the dead rise | due: Haywane 28 | shown: none
SECRET: Kade's sale — Kade sold the weir route to the Highmark legation
</plan>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = []; page.on('pageerror', e => logs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error' || /Story Director/.test(m.text())) logs.push(m.text()); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1 && typeof window.storyDirectorInterceptor === 'function', null, { timeout: 60000 });
await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
await page.waitForFunction(() => SillyTavern.getContext().chat?.length > 0, null, { timeout: 20000 });
await page.waitForTimeout(1000);
// Stand in for the model: the planner's call returns a scripted answer.
await page.evaluate(plan => {
  const original = window.SillyTavern.getContext;
  window.__plannerCalls = [];
  window.SillyTavern.getContext = () => ({ ...original(), generateRaw: async args => { window.__plannerCalls.push(args); return plan; } });
}, PLAN);
await page.evaluate(() => window.StoryBlock.refresh()); await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:story-director"]')?.click()); await page.waitForTimeout(400);
await page.click('.story-director-arc-plan');
await page.waitForSelector('.story-director-draft-text', { timeout: 10000 });
const draft = await page.evaluate(() => ({ text: document.querySelector('.story-director-draft-text').value, findings: [...document.querySelectorAll('.story-director-draft-finding')].map(n => n.textContent), call: { system: window.__plannerCalls[0]?.systemPrompt?.slice(0, 160), hasTracker: /Off-screen|Hooks|nothing tracked/i.test(window.__plannerCalls[0]?.systemPrompt ?? ''), length: window.__plannerCalls[0]?.responseLength } }));
console.log('draft:', JSON.stringify(draft, null, 1));
await page.screenshot({ path: 'shots/director-arc-draft.png' });
await page.click('.story-director-draft-accept');
await page.waitForTimeout(1500);
const after = await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  await window.storyDirectorInterceptor(ctx.chat, 8000, () => {}, 'normal');
  return { note: ctx.extensionPrompts?.story_director?.value.split('\n').slice(0, 9).join('\n'), arcHead: document.querySelector('.story-director-arc-name')?.textContent, progress: document.querySelector('.story-director-arc-progress')?.textContent, director: window.StoryBlock.getBlock('Director')?.text.split('\n').filter(l => /arc-/.test(l)).length };
});
console.log('after accept:', JSON.stringify(after, null, 1));
await page.evaluate(() => window.StoryBlock.refresh()); await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/director-arc.png' });
console.log(logs.slice(-6).join('\n'));
await browser.close();
