import { open, sleep, reloadReady } from './lib.mjs';
const { browser, page, errors, ev } = await open({ width: 1440 });
console.log(await ev(() => ({ chars: SillyTavern.getContext().characters.length, pop: [...document.querySelectorAll('dialog[open]')].length })));
await ev(() => { SillyTavern.getContext().extensionSettings.storySuite.host.tailBudget = 1234; SillyTavern.getContext().saveSettingsDebounced(); }); await sleep(3000);
await reloadReady(page);
console.log(await ev(() => ({ chars: SillyTavern.getContext().characters.length, tb: SillyTavern.getContext().extensionSettings.storySuite.host.tailBudget })));
console.log(errors.filter(e => /DIALOG|Settings not/.test(e)).slice(0,3));
await browser.close();
