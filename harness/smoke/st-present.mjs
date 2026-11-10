import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
for (const [name, vp, mobile] of [['phone', { width: 390, height: 900 }, true], ['wide', { width: 1280, height: 900 }, false]]) {
  const page = await browser.newPage({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', e => console.log(name, 'pageerror', e.message));
  await page.goto('http://127.0.0.1:8123/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 1, null, { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.evaluate(async () => { const ctx = SillyTavern.getContext(); await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === 'Seraphina'))); });
  await page.waitForTimeout(3000);
  if (await page.evaluate(() => document.querySelector('#story_block_sidebar')?.dataset.mode) !== 'docked') { await page.evaluate(() => window.StoryBlock?.open?.() ?? document.querySelector('#story_block_handle')?.click()); await page.waitForTimeout(800); }
  await page.evaluate(() => document.querySelector('.story-block-sidebar-tab[data-tab-id="ext:npc-state-delta-cast"]')?.click()); await page.waitForTimeout(600);
  await page.evaluate(async () => {
    const m = await import('/scripts/extensions/third-party/npc_state_delta/present-scene.js');
    const npcs = [
      { id: 'a', name: 'The Astral-Bound Spirit of the Northern Vale', role: 'Spirit companion', mood: 'Curious; wary of the strangers by the river, protective of Ren', condition: 'Faint, its mist thinned after the crossing', outfit: '' },
      { id: 'b', name: 'Kael', role: 'Mercenary captain', mood: 'Impatient', condition: 'Bandaged left arm', outfit: 'Dented breastplate, red sash' },
      { id: 'c', name: 'Mira', role: 'Ferry keeper', mood: 'Calm, watchful, humming an old river song', condition: 'Tired after the night crossing', outfit: 'Oilskin coat over a patched blue dress' },
      { id: 'd', name: 'Old Toma', role: 'Village elder' },
    ];
    const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a8caf"/><stop offset="1" stop-color="#2b3a4a"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="200" cy="170" r="80" fill="#e8d5b5"/><rect x="110" y="260" width="180" height="240" rx="60" fill="#8a3b3b"/></svg>');
    const img = `data:image/svg+xml,${svg}`;
    const scene = m.presentSceneModel({ cards: npcs, chatterText: 'The Astral-Bound Spirit of the Northern Vale: They followed us from the river.\nKael: Then we cut them off at the ford.\nA Hooded Stranger: Not yet. Let them come.' });
    const card = npc => {
      const now = m.nowSlotHtml(scene, npc.id);
      const chatter = m.chatterSlotsHtml(scene, npc.id);
      const portrait = npc.id === 'b' ? `<img src="${img}" alt="">` : `<div class="npc-state-delta-present-card-placeholder"><span>${npc.name[0]}</span></div>`;
      const html = `<button type="button" class="npc-state-delta-present-card" data-npc-id="${npc.id}"><span class="npc-state-delta-present-card-portrait">${portrait}</span><span class="npc-state-delta-present-card-text"><b class="npc-state-delta-present-card-name" title="${npc.name}">${npc.name}</b><small class="npc-state-delta-present-card-role">${npc.role}</small>${now}</span></button>`;
      const side = chatter ? chatter : (now ? `<div class="npc-state-delta-present-side npc-state-delta-present-side-now">${now}</div>` : `<div class="npc-state-delta-present-side npc-state-delta-present-side-idle"><small class="npc-state-delta-present-side-role">${npc.role}</small><small class="npc-state-delta-present-side-muted">No changes this turn</small></div>`);
      const kind = chatter ? 'chatter' : (now ? 'now' : 'idle');
      return `<div class="npc-state-delta-present-cell npc-state-delta-present-cell-${kind}" data-npc-id="${npc.id}">${html}${side}</div>`;
    };
    const section = `<section class="npc-state-delta-present-roster"${m.sceneAttr(scene)}><div class="npc-state-delta-present-roster-head"><span class="npc-state-delta-kicker">PRESENT NPCS</span><small>4 shown</small></div><div class="npc-state-delta-present-grid">${npcs.map(card).join('')}</div>${m.othersSlotsHtml(scene)}</section>`;
    const pane = document.querySelector('.story-block-pane[data-tab-id="ext:npc-state-delta-cast"]');
    pane.innerHTML = `<div class="npc-state-delta-story-pane">${section}</div>`;
    m.rememberPresentScene?.(scene);
    m.fillPresentSceneText(pane);
  });
  await page.waitForTimeout(500);
  console.log(name, JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.npc-state-delta-present-card')].map(c => ({ w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height), text: c.innerText.replace(/\s+/g, ' ') })))));
  await page.evaluate(() => { const p = document.querySelector('.story-block-pane[data-tab-id="ext:npc-state-delta-cast"]'); p.scrollTop = p.scrollHeight; });
  await page.locator('.npc-state-delta-present-cell[data-npc-id="c"]').screenshot({ path: `${S}/shots/present-${name}-mira-mid.png` });
  console.log(name, 'mira side:', await page.evaluate(() => { const s = document.querySelector('.npc-state-delta-present-cell[data-npc-id="c"] .npc-state-delta-present-side'); return s ? `${getComputedStyle(s).display} ${Math.round(s.getBoundingClientRect().height)} ${s.innerText.replace(/\s+/g, ' ')}` : 'missing'; }));
  console.log(name, 'bubbles:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.npc-state-delta-present-roster [data-delta-text]')].map(n => n.textContent).filter(t => /river|ford|Let them|Stranger/.test(t)))));
  await page.close();
}
await browser.close();
