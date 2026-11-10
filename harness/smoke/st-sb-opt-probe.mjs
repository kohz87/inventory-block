import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
await page.goto(process.env.ST_URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(15000);
console.log(await page.evaluate(() => JSON.stringify({ chars: window.SillyTavern?.getContext?.()?.characters?.length, sb: window.StoryBlock?.apiVersion, nsd: Boolean(window.NPCStateDelta), sd: Boolean(window.StoryDirector), rb: typeof window.rpgBattleInterceptor })));
console.log(errs.slice(0, 8).join('\n'));
await browser.close();
