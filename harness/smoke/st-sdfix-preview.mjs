import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
await h.openNarrator(process.env.CHAT);
const p = await h.ev(() => window.StoryDirector.preview());
console.log(JSON.stringify(p).slice(0, 200));
console.log('tail part:', JSON.stringify(String(p.text ?? '').split('\n\n').slice(1).join('\n\n').slice(0, 400)));
await h.browser.close();
