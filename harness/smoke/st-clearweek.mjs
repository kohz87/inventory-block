import { open } from './demo-common.mjs';
const h = await open({ width: 1200, height: 900 });
const { page, ev } = h;
console.log(await ev(async () => { const ctx = SillyTavern.getContext(); const own = ctx.extensionSettings.storyDirector; own.calendar.week = []; own.calendar.weekOffset = 0; delete own.worldPack; await ctx.saveSettings?.(); return JSON.stringify(own.calendar.week); }));
await page.waitForTimeout(2500);
await h.browser.close();
