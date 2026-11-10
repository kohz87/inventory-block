import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 60000 });
console.log(await page.evaluate(() => JSON.stringify(SillyTavern.getContext().extensionSettings.storyBlock.blocks.map(b => [b.id, b.enabled, b.visible, b.optional, b.kind]))));
await browser.close();
