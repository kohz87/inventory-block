import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage();
page.on('response', r => { if (r.status() === 404) console.log('404', r.url()); });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(4000);
await browser.close();
