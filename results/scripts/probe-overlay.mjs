// The Settings overlay's Features rows: ids, labels, keyboard.
import fs from 'node:fs';
import { launch, waitHost, connect, ST_URL, shot, j } from './common.mjs';
import { openChat } from './lib-ui.mjs';
const { chat } = JSON.parse(fs.readFileSync(new URL('./chat.json', import.meta.url)));
const { browser, page, errors } = await launch();
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page); await connect(page); await openChat(page, chat);
await page.click('.story-suite-bar-settings');
await page.waitForSelector('#story_suite_v2_overlay');
await page.evaluate(() => { for (const d of document.querySelectorAll('#story_suite_v2_overlay details')) d.open = true; });
const ids = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature')];
    const byId = {};
    for (const r of rows) { const i = r.querySelector('input'); byId[i.id] = (byId[i.id] ?? 0) + 1; }
    return { rows: rows.length, byId, docDupes: Object.fromEntries(Object.keys(byId).map(id => [id, document.querySelectorAll(`[id="${id}"]`).length])) };
});
console.log('ids', j(ids));
// Click the label text (the <b>) of the hud row inside the Story Block fold (the second row with that id).
const before = await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature[data-feature="story-block.hud"] input')].map(i => i.checked));
const rows = page.locator('#story_suite_v2_overlay .story-suite-feature[data-feature="story-block.hud"] b');
await rows.nth(1).scrollIntoViewIfNeeded();
await rows.nth(1).click();
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({ inputs: [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature[data-feature="story-block.hud"] input')].map(i => i.checked), sdk: StoryBlock.sdk.feature('story-block.hud'), stored: SillyTavern.getContext().extensionSettings.storySuite.features }));
console.log('label click in module fold', j({ before, after }));
await shot(page, 'overlay-features-1440');
// keyboard: focus the first switch, press Space
await page.focus('#story_suite_v2_overlay .story-suite-feature input');
await page.keyboard.press('Space');
await page.waitForTimeout(300);
console.log('space', j(await page.evaluate(() => ({ active: document.activeElement?.closest('.story-suite-feature')?.dataset.feature, inputs: [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature input')].map(i => `${i.closest('.story-suite-feature').dataset.feature}=${i.checked}`), sdk: StoryBlock.sdk.features().map(f => `${f.id}=${f.on}`) }))));
// Escape closes?
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
console.log('escape closes overlay:', await page.evaluate(() => !document.querySelector('#story_suite_v2_overlay')));
// a11y: names
console.log('a11y', j(await page.evaluate(() => [...document.querySelectorAll('#story_suite_v2_overlay .story-suite-feature input')].slice(0, 2).map(i => ({ role: i.getAttribute('role'), labels: [...i.labels].map(l => l.innerText.replace(/\s+/g, ' ').slice(0, 40)) })))));
console.log('errors', errors.filter(e => !/dossier|404/.test(e)).join('\n'));
await browser.close();
