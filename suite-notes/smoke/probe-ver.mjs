import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright');
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://127.0.0.1:8150/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => globalThis.StoryBlock?.version, null, { timeout: 120000 });
console.log(await p.evaluate(() => StoryBlock.version)); await b.close();
