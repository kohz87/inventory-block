import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', e => errors.push('pageerror ' + e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StorySuite?.api('story-block')?.openSuite, null, { timeout: 60000 });
await page.waitForTimeout(4000);
const launcher = () => page.evaluate(() => { const n = document.querySelector('#npc_state_delta_dossier_launcher'); return n ? getComputedStyle(n).display : 'missing'; });
console.log('launcher before:', await launcher());
await page.evaluate(() => window.StorySuite.api('story-block').openSuite('rpg-battle')); await page.waitForTimeout(600);
console.log('launcher open:', await launcher(), 'body class:', await page.evaluate(() => document.body.classList.contains('story-suite-open')));
await page.screenshot({ path: '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/shots/overlay-phone-fixed.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(400);
console.log('launcher after:', await launcher());
// Persona prefill: render the RPG tab's create view directly.
console.log('persona:', await page.evaluate(() => SillyTavern.getContext().name1));
console.log('errors:', errors.join('\n') || 'none');
await browser.close();
