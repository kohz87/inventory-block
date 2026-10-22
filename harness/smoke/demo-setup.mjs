import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock, null, { timeout: 60000 });
await page.waitForTimeout(2500);
console.log(await page.evaluate(async () => {
  const ctx = SillyTavern.getContext();
  if (!ctx.characters.some(c => c.name === 'The Narrator')) {
    const form = new FormData();
    form.append('ch_name', 'The Narrator');
    form.append('description', 'The narrator of a low-fantasy frontier story. Writes in second person, grounded and concrete.');
    form.append('first_mes', 'placeholder');
    form.append('personality', ''); form.append('scenario', ''); form.append('mes_example', '');
    form.append('creator_notes', ''); form.append('talkativeness', '0.5'); form.append('fav', 'false'); form.append('tags', '');
    const headers = ctx.getRequestHeaders(); delete headers['Content-Type'];
    const res = await fetch('/api/characters/create', { method: 'POST', headers, body: form });
    if (!res.ok) return 'create failed ' + res.status + ' ' + await res.text();
    await ctx.getCharacters?.();
  }
  const s = ctx.extensionSettings.storyBlock;
  return JSON.stringify({ chars: ctx.characters.map(c => c.name), blocks: s.blocks.map(b => `${b.id}:${b.enabled}`), persona: ctx.name1, personas: Object.values(ctx.powerUserSettings?.personas ?? {}) });
}));
await browser.close();
