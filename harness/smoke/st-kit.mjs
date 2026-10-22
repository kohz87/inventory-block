import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', m => { if (/RPG Battle/.test(m.text())) console.log('LOG', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', e => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
await page.waitForTimeout(4000);
console.log('in-browser fallback:', await page.evaluate(async () => {
  const base = '/scripts/extensions/third-party/rpg_battle/src/';
  const { fallbackKit } = await import(base + 'kit.js'); const { DEFAULT_SKILLS } = await import(base + 'skills.js'); const { makeRules } = await import(base + 'rules.js');
  return fallbackKit({ focus: ['INT', 'VIT'], level: 3, role: 'healer' }, DEFAULT_SKILLS, makeRules(SillyTavern.getContext().extensionSettings.rpgBattle?.rules ?? null)).map(s => s.name);
}));
console.log('rpg settings rules:', JSON.stringify(await page.evaluate(() => { const s = SillyTavern.getContext().extensionSettings.rpgBattle ?? {}; return { rules: s.rules, gear: s.gear, terms: s.terms, flavour: s.flavour }; })));
await browser.close();
