import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.locator('#extensions-settings-button .drawer-icon').first().tap();
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('.story-block-settings .inline-drawer-toggle').click());
await page.waitForTimeout(500);
console.log(await page.evaluate(() => {
  const c = document.querySelector('.story-block-row-controls');
  const rules = [];
  for (const sheet of document.styleSheets) { let list; try { list = sheet.cssRules; } catch { continue; }
    for (const r of list) { const walk = rr => { if (rr.cssRules && !rr.selectorText) { for (const x of rr.cssRules) walk(x); return; } if (rr.selectorText && c.matches(rr.selectorText) && /width|flex/.test(rr.style.cssText)) rules.push((sheet.href || 'inline').split('/').pop() + ' :: ' + rr.selectorText + ' { ' + rr.style.cssText + ' }'); }; walk(r); } }
  return getComputedStyle(c).width + '\n' + rules.join('\n');
}));
await browser.close();
