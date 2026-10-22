import { createHost } from '../Story_block/testkit/index.js';
const items = [];
for (let i = 0; i < 1000; i++) items.push({ name: `Thing ${i}`, kind: 'goods', value: i, aliases: [`t${i}`, `thingy ${i}`], note: 'n'.repeat(300) });
const base = { id: 'big-pack', version: '1.0.0', name: 'Big', requires: { storyBlock: '^2' }, content: { items }, start: { inventory: { items: items.slice(0, 200).map(it => ({ item: it.name })), money: 5 } } };
let text = JSON.stringify(base);
console.log('bytes', text.length);
const host = await createHost();
let t = Date.now();
let r = await host.packs.packs.install(text, { origin: 'pack.json' });
console.log('install', r.ok, JSON.stringify(r.errors ?? '').slice(0, 300), Date.now() - t, 'ms');
host.close();
// replies with the pack enabled
const settings = structuredClone(host.ctx.extensionSettings.storySuite);
const h2 = await createHost({ settings });
for (let i = 0; i < 3; i++) { t = Date.now(); await h2.send('go', `Ok.\n\n<Changes>\n+ item Thing ${500 + i} | qty: 1\n</Changes>`); console.log('reply', Date.now() - t, 'ms'); }
console.log('settings bytes', JSON.stringify(h2.ctx.extensionSettings).length, 'chat bytes', JSON.stringify(h2.ctx.chat).length);
h2.close();
// 10 MB pack
const huge = JSON.stringify({ ...base, description: 'x'.repeat(10 * 1024 * 1024) });
const h3 = await createHost(); t = Date.now(); r = await h3.packs.packs.install(huge, { origin: 'pack.json' }); console.log('10MB', r.ok, r.errors?.[0]?.message, Date.now() - t, 'ms'); h3.close();
// deep nesting JSON
const deep = '{"id":"deep","version":"1.0.0","name":"D","requires":{"storyBlock":"^2"},"content":{},"description":' + '['.repeat(100000) + ']'.repeat(100000) + '}';
const h4 = await createHost(); t = Date.now(); try { r = await h4.packs.packs.install(deep, { origin: 'pack.json' }); console.log('deep', r.ok, r.errors?.[0]?.message, Date.now() - t, 'ms'); } catch (e) { console.log('deep THROWS', e.message); } h4.close();
