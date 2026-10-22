import { launch, waitHost, connect, narrator, ST_URL } from './common.mjs';
const { browser, page, errors } = await launch();
await page.goto(ST_URL, { waitUntil: 'domcontentloaded' });
await waitHost(page);
await connect(page); await narrator(page);
await page.evaluate(async () => { const c = SillyTavern.getContext(); await c.openCharacterChat(c.characters[c.characterId].chat); await new Promise(r => setTimeout(r, 2500)); });
console.log(JSON.stringify(await page.evaluate(async () => {
  const mod = await import('/scripts/extensions/third-party/Story_block/src/v2/packs/index.js');
  return { packs: mod.packs.list().map(p => `${p.id}:${p.enabled}:missing=${p.missing}:${JSON.stringify(p.counts)}`), queries: StoryBlock.sdk.modules().find(m => m.id === 'rpg-battle'), dialog: document.querySelector('.ss-dialog')?.innerText?.slice(0, 600), chat: SillyTavern.getContext().chat.length, q: (()=>{try{return JSON.stringify(StoryBlock.sdk.query("creation.choices",{})).slice(0,300)}catch(e){return e.message}})(), pq: (()=>{try{return JSON.stringify(StoryBlock.sdk.query("packs.list",{})).slice(0,300)}catch(e){return e.message}})() };
})));
console.log(errors.join('\n'));
await browser.close();
