import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
await h.ev(async () => { const c = SillyTavern.getContext(); delete c.extensionSettings.storyBlock.tabLayout; c.saveSettingsDebounced(); await new Promise(r => setTimeout(r, 2500)); });
await h.page.waitForTimeout(1500);
await h.browser.close();
