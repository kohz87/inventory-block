// U8 mockup: Story Studio Cast editor, injected into the real Story Studio (main, 0.4.0) with the Ersveil pack.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
const S = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const OUT = S + '/u8/shots';
const CSS = `
.cast-card{display:grid!important;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;text-align:left}
.cast-card img{width:44px;height:44px;border-radius:10px;object-fit:cover}
.cast-card .record-card-meta{white-space:normal}
.cc-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.cc-tag{font-size:11px;padding:1px 8px;border-radius:999px;border:1px solid color-mix(in srgb,currentColor 22%,transparent);opacity:.85}
.cf-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.cf input,.cf select,.cf textarea{max-width:100%;box-sizing:border-box}
.cf-row input{min-width:0}
.cf-grid .wide{grid-column:1/-1}
.cf label.field{display:grid;gap:4px}
.cf textarea{width:100%;box-sizing:border-box;min-height:64px}
.cf-hint{font-size:12px;opacity:.72;margin:2px 0 0;line-height:1.4}
.cf-portrait{display:grid;grid-template-columns:100px minmax(0,1fr);gap:14px;align-items:start}
.cf-portrait img{width:100px;height:125px;object-fit:cover;border-radius:12px;border:1px solid color-mix(in srgb,currentColor 15%,transparent)}
.cf-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cf-chip{display:inline-flex;gap:6px;align-items:center;font-size:13px;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--accent,#6d5ce6) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent,#6d5ce6) 35%,transparent)}
.cf-chip button{all:unset;cursor:pointer;opacity:.6}
.cf-secret{display:grid;gap:8px;padding:12px;border-radius:12px;border:1px solid color-mix(in srgb,currentColor 14%,transparent);margin-bottom:10px}
.cf-secret-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.cf-secret-head b{font-size:14px}
.cf-seg{display:inline-flex;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:999px;overflow:hidden}
.cf-seg span{padding:4px 12px;font-size:12.5px}
.cf-seg span[aria-pressed=true]{background:var(--accent,#6d5ce6);color:#fff}
.cf-preview{padding:10px 12px;border-radius:12px;background:color-mix(in srgb,currentColor 5%,transparent);font-size:13px;display:grid;gap:6px}
.cf-bar{display:block;height:11px;border-radius:6px;background:repeating-linear-gradient(90deg,color-mix(in srgb,currentColor 20%,transparent) 0 10px,color-mix(in srgb,currentColor 9%,transparent) 10px 14px)}
.cf-ok{color:var(--good,#2f855a)}.cf-warn{color:var(--warn,#b7791f)}
.cf-list{display:grid;gap:6px;font-size:13px;margin:0;padding-left:18px}
.cf-zip{font:12px/1.5 ui-monospace,Menlo,monospace;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,currentColor 6%,transparent);white-space:pre}
`;
const face = (hair, skin, coat, braid) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 300'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a4a5c'/><stop offset='1' stop-color='#1a2230'/></linearGradient></defs><rect width='240' height='300' fill='url(#g)'/><path d='M30 300c6-70 40-104 90-104s84 34 90 104z' fill='${coat}'/><circle cx='120' cy='130' r='52' fill='${skin}'/><path d='M66 128c0-44 24-68 54-68s54 24 54 68c-8-28-28-42-54-42s-46 14-54 42z' fill='${hair}'/>${braid ? `<path d='M168 140c16 24 16 64 2 92' stroke='${hair}' stroke-width='13' fill='none' stroke-linecap='round'/>` : ''}</svg>`);
const FENNA = face('#9c9c9c', '#c9a589', '#4b5a44', true);
const SERA = face('#b5452f', '#e0b896', '#5b5f6b', false);
const browser = await chromium.launch();
async function open(h = 1000) {
  const page = await browser.newPage({ viewport: { width: 1440, height: h } });
  await page.goto('file://' + S + '/sync280/Story_studio/dist/story-studio.html'); await page.waitForTimeout(1500);
  await page.locator('#pack-file').setInputFiles(S + '/rel212/Story_block/examples/packs/ersveil/pack.json'); await page.waitForTimeout(2500);
  await page.locator('.rail').getByRole('button', { name: /^Places/ }).click(); await page.waitForTimeout(800);
  await page.locator('.record-card').first().click(); await page.waitForTimeout(600);
  await page.addStyleTag({ content: CSS });
  await page.evaluate(({ FENNA, SERA }) => {
    // rail: a Cast entry after People / creatures
    const people = [...document.querySelectorAll('.rail button')].find(b => /People \/\s*creatures/.test(b.textContent));
    const cast = people.cloneNode(true);
    cast.querySelector('.label') ? (cast.querySelector('.label').textContent = 'Cast') : (cast.childNodes.forEach(n => { if (n.nodeType === 3 && /People/.test(n.textContent)) n.textContent = 'Cast'; }));
    const small = cast.querySelector('small'); if (small) small.textContent = '2';
    [...cast.querySelectorAll('span')].forEach(s => { if (/People/.test(s.textContent) && !s.querySelector('*')) s.textContent = 'Cast'; });
    const ic = cast.querySelector('svg'); if (ic) { ic.setAttribute('viewBox', '0 0 256 256'); ic.innerHTML = '<path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/>'; }
    people.after(cast);
    document.querySelectorAll('.rail button[aria-current], .rail button[aria-pressed=true]').forEach(b => { b.removeAttribute('aria-current'); b.setAttribute('aria-pressed', 'false'); b.classList.remove('active', 'selected'); });
    cast.setAttribute('aria-current', 'page'); cast.setAttribute('aria-pressed', 'true'); cast.classList.add('active');
    const placesBtn = [...document.querySelectorAll('.rail button')].find(b => /^Places/.test(b.textContent.trim()));
    if (placesBtn) { cast.className = placesBtn.className; placesBtn.className = people.className; }
    // list
    document.querySelector('.records-header h1').textContent = 'Cast';
    document.querySelector('.records-subtitle').textContent = '2 people · hidden from players until met';
    const add = document.querySelector('.records-header button'); add.textContent = '+ Add person';
    const list = document.querySelector('.records-list'); const proto = list.firstElementChild;
    const card = (img, name, meta, tags, on) => { const c = proto.cloneNode(true); c.classList.add('cast-card'); c.setAttribute('aria-pressed', on ? 'true' : 'false');
      c.innerHTML = `<img src="${img}" alt=""><span><span class="record-card-header"><span class="record-card-name">${name}</span></span><span class="record-card-meta">${meta}</span><span class="cc-tags">${tags.map(t => `<span class="cc-tag">${t}</span>`).join('')}</span></span>`; return c; };
    list.replaceChildren(card(FENNA, 'Fenna', 'fenna · ferrywoman, forty-one · starts at Bluewatch Village', ['3 secrets', 'portrait 38 KB'], true),
      card(SERA, 'Sera', 'sera · sellsword hunting her brother’s killer · starts at Ashford', ['2 secrets', 'drawn to 2', 'portrait 41 KB'], false));
    document.body.classList.add('cast-wide');
  }, { FENNA, SERA });
  return page;
}
const field = (label, value, { area = false, wide = false, hint = '' } = {}) => `<label class="field${wide ? ' wide' : ''}">${label}${area ? `<textarea>${value}</textarea>` : `<input value="${value.replace(/"/g, '&quot;')}">`}${hint ? `<span class="cf-hint">${hint}</span>` : ''}</label>`;
const head = (title) => `<div class="inspector-title-row"><h2>${title}</h2><span class="chip">Cast</span></div>`;
async function inspector(page, html, scrollSel) {
  await page.evaluate(({ html, scrollSel }) => {
    const b = document.querySelector('.inspector-body'); b.innerHTML = html;
    const el = scrollSel ? b.querySelector(scrollSel) : null;
    if (el) { el.scrollIntoView({ block: 'start', inline: 'nearest' }); }
    window.scrollTo(0, 0); document.querySelectorAll('*').forEach(n => { if (n.scrollLeft) n.scrollLeft = 0; });
  }, { html, scrollSel });
  await page.waitForTimeout(400);
}
const shot = async (page, name) => { await page.mouse.move(1, 1); await page.screenshot({ path: `${OUT}/${name}.png` }); };

const WHO = `<fieldset class="form-fieldset cf"><legend>Who they are</legend><div class="cf-grid">
  ${field('Name', 'Fenna')}${field('Also called', 'the ferrywoman', { hint: 'Comma between names.' })}
  ${field('In one line', 'Ferrywoman of Bluewatch, forty-one, bad knee, knows every current.', { wide: true })}
  ${field('Look', 'Weathered face, wet oilskin, a long grey braid, limps on her left knee.', { area: true, wide: true })}
  ${field('Voice', 'Blunt, dry, kind underneath; calls everyone “love”.', { wide: true })}
  ${field('Personality', 'Stubborn, practical, fiercely protective of the river folk; distrusts the guild.', { area: true, wide: true })}
  ${field('Background', 'Lost her husband to the weir in 598; has run the night ferry alone since.', { area: true, wide: true })}
  </div><p class="cf-hint">Hidden from players until they meet her; then NPC State Delta makes her dossier from this, at once.</p></fieldset>`;
const PORTRAIT = (img) => `<fieldset class="form-fieldset cf" data-cf="portrait"><legend>Portrait</legend><div class="cf-portrait"><img src="${img}" alt="Fenna's portrait">
  <div style="display:grid;gap:8px"><div class="cf-row"><button type="button">Choose image…</button><button type="button">Remove</button></div>
  <p class="cf-hint">fenna.webp · 480 × 600 · <b class="cf-ok">38 KB</b> (shrunk from 1.2 MB PNG). Pictures are made smaller automatically to fit 64 KB; JPEG, PNG or WebP.</p>
  <p class="cf-hint">Exported beside the pack in portraits/; shown on her dossier from the first meeting.</p></div></div></fieldset>`;
const START = `<fieldset class="form-fieldset cf" data-cf="start"><legend>Where her story starts</legend><div class="cf-grid">
  <label class="field">Place<select><option>Bluewatch Village / Docks</option></select><span class="cf-hint">From this pack’s places (320).</span></label>
  ${field('Routine', 'works the night ferry; mends nets by day', { hint: 'Where and when she can be found. A first meeting happens here.' })}
  ${field('Her goal', 'keep the night ferry running; find out who opened the weir', { wide: true })}
  </div></fieldset>
  <fieldset class="form-fieldset cf" data-cf="drawn"><legend>Drawn to <small class="muted">(optional)</small></legend>
  <div class="cf-row"><span class="cf-chip">the weir <button aria-label="Remove">✕</button></span><span class="cf-chip">anyone hiring the night ferry <button aria-label="Remove">✕</button></span><input placeholder="Add…" style="width:160px"></div>
  <p class="cf-hint">When the story touches one of these, she comes looking for the party.</p></fieldset>
  <fieldset class="form-fieldset cf" data-cf="rel"><legend>Relationship at the start</legend><div class="cf-grid">
  <label class="field">Meters<select><option>Companion (Trust, Affection, Desire, Tension)</option></select></label>
  ${field('Trust', '10')}
  ${field('Stages', 'Wary · Trusts you on the water · Calls you crew', { wide: true, hint: 'Separated by “·”.' })}
  ${field('Fields', 'Rank: Guild associate', { wide: true, hint: 'Your own dossier fields, one per line as “Name: value” — held while she is away.' })}
  </div></fieldset>
  <fieldset class="form-fieldset cf"><legend>Before she is met</legend><label class="field" style="display:flex;gap:8px;align-items:center"><input type="checkbox" style="width:18px;height:18px"> She may die off-screen before the party meets her</label><p class="cf-hint">Off by default, for every player’s setting. Hurt, losing things or moving are always possible.</p></fieldset>`;
const SECRET = (n, title, text, how, val) => `<div class="cf-secret"><div class="cf-secret-head"><b>Secret ${n}</b><span class="cf-row"><button type="button">↑</button><button type="button">↓</button><button type="button">Remove</button></span></div>
  ${field('Title (shown once it opens)', title)}${field('The secret', text, { area: true })}
  <div class="cf-row"><span>Opens</span><span class="cf-seg"><span aria-pressed="${how === 'meter'}">at a meter</span><span aria-pressed="${how === 'event'}">on a story event</span></span>
  ${how === 'meter' ? `<select style="width:auto"><option>Trust</option></select><input value="${val}" style="width:70px">` : `<input value="${val}" style="flex:1;min-width:0">`}</div></div>`;
const SECRETS = `<fieldset class="form-fieldset cf" data-cf="secrets"><legend>Secrets · 3 of 8</legend>
  ${SECRET(1, 'Her husband’s debt', 'He owed the smugglers; she still pays it off, one night crossing at a time.', 'meter', '20')}
  ${SECRET(2, 'The weir night', 'She was paid to look away the night the weir was opened.', 'meter', '60')}
  ${SECRET(3, 'Who paid her', 'The guild’s own treasurer, Aldric Merin.', 'event', 'the party finds the weir ledger')}
  <div class="cf-row"><button type="button">+ Add secret</button><span class="cf-hint">Light to deep. The narrator knows them all from the first meeting and keeps them; the player sees each one when it opens.</span></div>
  <div class="cf-preview"><b>What the player sees after meeting her</b><div><b>Her husband’s debt</b> · opens at Trust 20</div><span class="cf-bar" style="width:62%"></span><span class="cf-hint">Opens at Trust 60</span><span class="cf-bar" style="width:48%"></span><span class="cf-hint">Opens with the story (the event's words are never shown)</span></div></fieldset>`;

// S1: the list + who she is + portrait
{ const page = await open(1000); await inspector(page, head('Fenna') + WHO + PORTRAIT(FENNA)); await shot(page, 'S1-who'); await page.close(); }
// S2: portrait + start + drawn to + relationship
{ const page = await open(1000); await inspector(page, head('Fenna') + WHO + PORTRAIT(FENNA) + START, '[data-cf=portrait]'); await shot(page, 'S2-start'); await page.close(); }
// S3: secrets
{ const page = await open(1100); await inspector(page, head('Fenna') + WHO + START + SECRETS, '[data-cf=secrets]'); await shot(page, 'S3-secrets'); await page.close(); }
// S4: check / export
{ const page = await open(1000);
  await page.evaluate(() => { document.querySelector('.records-header h1').textContent = 'Check / export'; document.querySelector('.records-subtitle').textContent = 'Ersveil (open world) 1.2.0'; document.querySelector('.records-header button').remove(); document.querySelector('.records-list').replaceChildren();
    const cast = [...document.querySelectorAll('.rail button')].find(b => /^Cast/.test(b.textContent.trim())); const chk = [...document.querySelectorAll('.rail button')].find(b => /^Check/.test(b.textContent.trim()));
    if (cast && chk) { const a = cast.className; cast.className = chk.className; chk.className = a; cast.setAttribute('aria-pressed', 'false'); cast.removeAttribute('aria-current'); chk.setAttribute('aria-current', 'page'); chk.scrollIntoView({ block: 'nearest' }); } });
  await inspector(page, `<div class="inspector-title-row"><h2>Export</h2><span class="chip">1.2.0</span></div>
  <fieldset class="form-fieldset cf"><legend>Check</legend><ul class="cf-list">
   <li class="cf-ok">Cast: 2 people, all fields within limits.</li>
   <li class="cf-ok">Portraits: 2 files, 79 KB together (each under 64 KB).</li>
   <li class="cf-ok">Starting places exist in this pack.</li>
   <li class="cf-ok">Secrets: 5, each opens at a meter or on a story event.</li>
   <li class="cf-warn">Sera has no voice written — the narrator will invent one at the first meeting.</li></ul></fieldset>
  <fieldset class="form-fieldset cf"><legend>Export</legend><div class="cf-zip">ersveil-1.2.0.zip
  pack.json            486 KB
  portraits/fenna.webp  38 KB
  portraits/sera.webp   41 KB</div>
  <div class="cf-row" style="margin-top:10px"><button type="button" class="primary">Export .zip</button><button type="button">Export pack.json only</button></div>
  <p class="cf-hint">Story Block imports the .zip in Settings → Tabs &amp; Packs. A newer version brings new people into running chats from that story day, hidden until met; people already met keep their dossiers.</p></fieldset>`);
  await shot(page, 'S4-export'); await page.close(); }
await browser.close(); console.log('ok');
