import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.NPCStateDelta && window.StoryBlock, null, { timeout: 60000 });
await page.waitForTimeout(2000);
console.log(await page.evaluate(() => JSON.stringify({ nsd: Object.keys(window.NPCStateDelta), sd: Object.keys(window.StoryDirector), sb: Object.keys(window.StoryBlock), rpg: Object.keys(window.StorySuite.providers().find(p => p.id === 'rpg-battle')?.api ?? {}) })));
await browser.close();
