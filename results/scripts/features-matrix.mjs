// F100: all 16 on/off combos of Story Block's features, set through the Settings overlay, then every surface.
import fs from 'node:fs';
import { launch, waitHost, connect, ST_URL, shot, j } from './common.mjs';
import { openChat, setFeaturesViaOverlay, probeSurfaces } from './lib-ui.mjs';
const { chat } = JSON.parse(fs.readFileSync(new URL('./chat.json', import.meta.url)));
const W = Number(process.env.W ?? 1440);
const { browser, page, errors } = await launch({ width: W, height: W < 600 ? 844 : 900 });
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page); await connect(page); await openChat(page, chat);
const ids = ['story-block.hud', 'story-block.cards', 'story-block.preroll', 'story-block.extractor'];
const results = [];
for (let mask = 0; mask < 16; mask += 1) {
    const want = Object.fromEntries(ids.map((id, i) => [id, Boolean(mask & (1 << i))]));
    const e0 = errors.length;
    const set = await setFeaturesViaOverlay(page, want);
    const r = await probeSurfaces(page, { shot, shotPrefix: mask === 0 || mask === 15 ? `m${W}-${mask}` : null });
    const mismatch = ids.filter(id => r.features[id] !== want[id]);
    const hudBad = want['story-block.hud'] ? r.hud.length === 0 : r.hud.length > 0;
    const cardBad = want['story-block.cards'] ? r.cards === 0 : r.cards > 0;
    const newErr = errors.slice(e0).filter(e => !/dossier scan failed|404 \(Not Found\)/.test(e));
    results.push({ mask, want: ids.filter(id => want[id]).map(id => id.split('.')[1]).join('+') || 'none', mismatch, set: set.log, hud: r.hud.length, cards: r.cards, hudBad, cardBad, problems: r.problems, tabs: r.tabs, game: r.game, errors: newErr, xss: r.xss, rawMarkup: r.rawMarkup });
    console.log(j(results.at(-1)));
}
fs.writeFileSync(new URL(`./out-matrix-${W}.json`, import.meta.url), JSON.stringify(results, null, 1));
// restore defaults
await setFeaturesViaOverlay(page, { 'story-block.hud': true, 'story-block.cards': true, 'story-block.preroll': false, 'story-block.extractor': false });
await browser.close();
