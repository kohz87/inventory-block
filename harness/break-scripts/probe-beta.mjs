// Probe the live page: modules, features, the Packs panel's file input, and the commands/queries list.
import { launchRaw } from './cdp-page.mjs';
import { ST_URL, connectMock, waitHost } from './lib.mjs';
const { browser, page } = await launchRaw({ port: 9392 });
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0, 300)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
await page.goto(ST_URL);
await waitHost(page);
const out = await page.evaluate(() => {
    const sdk = StoryBlock.sdk;
    return {
        version: StoryBlock.version,
        modules: sdk.modules().map(m => typeof m === 'string' ? m : `${m.id ?? m.moduleId} ${m.version ?? ''}`),
        features: (() => { try { return sdk.features?.() ?? null; } catch (e) { return String(e); } })(),
        sdkKeys: Object.keys(sdk),
        packsFile: Boolean(document.querySelector('.ss-packs-file')),
        packsRows: [...document.querySelectorAll('.ss-packs-row')].map(r => r.textContent.slice(0, 80)),
        chars: SillyTavern.getContext().characters.map(c => c.name),
    };
});
console.log(JSON.stringify(out, null, 1));
console.log('errors', errs);
await browser.close();
