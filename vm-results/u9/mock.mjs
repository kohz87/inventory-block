// U9 mockup: Story Studio secret card — "…or also on a story event" (meter OR event, whichever first). Real Studio 0.5.0 + Ersveil 2.4.0 (EP branch).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto('file://' + S + '/sync280/Story_studio/dist/story-studio.html'); await page.waitForTimeout(1500);
await page.locator('#pack-file').setInputFiles(S + '/ep/Story_block/examples/packs/ersveil/pack.json'); await page.waitForTimeout(3000);
await page.locator('.rail').getByRole('button', { name: /^Cast/ }).click(); await page.waitForTimeout(1000);
await page.locator('.record-card').first().click(); await page.waitForTimeout(1200);
await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.cf-secret')]; const card = cards[cards.length - 1];
  const row = [...card.querySelectorAll('.cf-row')].pop();
  const extra = document.createElement('div'); extra.className = 'cf-field u9-also';
  extra.innerHTML = `<label class="field">…or also on a story event <small class="muted">(optional)</small><input value="Severa or an Inquest agent comes to Bluewatch"></label><span class="tl-count">45 / 120</span><p class="cf-hint" style="margin:4px 0 0">Opens at Trust 90 or when this happens, whichever comes first.</p>`;
  row.after(extra);
  const st = document.createElement('style'); st.textContent = '.u9-also{margin-top:8px;padding:10px 12px;border-radius:10px;border:1px dashed color-mix(in srgb,var(--accent,#6d5ce6) 55%,transparent);background:color-mix(in srgb,var(--accent,#6d5ce6) 6%,transparent)}.u9-also input{width:100%;box-sizing:border-box}';
  document.head.append(st);
  const prev = [...document.querySelectorAll('.inspector-body *')].filter(n => n.childElementCount === 0 && /Opens at Trust 90/.test(n.textContent)).pop();
  if (prev) prev.textContent = 'Opens at Trust 90 or with the story';
  card.scrollIntoView({ block: 'center' }); window.scrollTo(0, 0); document.querySelectorAll('*').forEach(n => { if (n.scrollLeft) n.scrollLeft = 0; });
});
await page.waitForTimeout(500); await page.mouse.move(1, 1);
await page.screenshot({ path: 'shots/E1-secret-either.png' });
await browser.close(); console.log('ok');
