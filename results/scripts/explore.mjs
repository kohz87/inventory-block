import { launch, waitHost, ev, j, ST_URL } from './common.mjs';
const { browser, page, errors } = await launch();
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
console.log(j(await ev(page, () => ({
    keys: Object.keys(window.StoryBlock), sdk: Object.keys(StoryBlock.sdk),
    modules: StoryBlock.sdk.modules().map(m => `${m.id}@${m.version} f=${m.features}`),
    features: StoryBlock.sdk.features().map(f => `${f.id}:${f.on}`),
    bar: document.querySelector('#story_suite_v2_bar')?.innerText,
}))));
console.log(errors.join('\n'));
await browser.close();
