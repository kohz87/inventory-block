import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', m => logs.push(`${m.type()} ${m.text().slice(0, 300)}`));
await page.goto(process.env.ST_URL, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StoryBlock?.apiVersion === 2 && StoryBlock.sdk.modules().length >= 4, null, { timeout: 90000 });
await page.waitForTimeout(2000);
console.log(await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'The Narrator')));
  await new Promise(r => setTimeout(r, 2000));
  let aborted = null;
  await window.storyBlockGenerationInterceptor(structuredClone(ctx.chat), 8000, x => { aborted = x; }, 'normal');
  const hooks = StoryBlock.sdk.modules().map(m => m.id);
  return JSON.stringify({ bars: document.querySelectorAll(".story-suite-bar").length, notices: [...document.querySelectorAll(".story-suite-notice")].map(n => [n.hidden, n.getAttribute("hidden"), getComputedStyle(n).display, n.textContent]), dialogs: document.querySelectorAll(".ss-dialog, .ss-dialog-backdrop").length, aborted, notice: document.querySelector('.story-suite-notice')?.hidden, text: document.querySelector('.story-suite-notice-text')?.textContent, dialog: !!document.querySelector('.ss-dialog'), pc: StoryBlock.sdk.view().state?.domains?.party?.pc ?? 'none', hooks, interceptors: Object.keys(window).filter(k => /Interceptor$/i.test(k)) });
}));
console.log(logs.filter(l => /Suite|Story|RPG|rpg/i.test(l)).join('\n'));
await browser.close();
