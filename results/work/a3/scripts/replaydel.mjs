// Load a dumped chat into a fresh host, delete the dumped index, compare live head with a fresh store.
import fs from 'node:fs';
import { allHost, storeMod } from './lib.mjs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.warn = () => {};
const h = await allHost();
await h.st.loadChat(d.chat);
console.log('loaded head == dumped head', JSON.stringify(h.head()) === JSON.stringify(d.head));
await h.st.deleteMessage(d.i);
const fresh = storeMod.createStore({ chat: () => structuredClone(h.ctx.chat), save: async () => {}, scratch: n => h.registry.scratch(n) });
console.log('del', d.i, 'live == fresh', JSON.stringify(h.head()) === JSON.stringify(fresh.head()));
console.log(JSON.stringify(h.head().domains.scene.present), JSON.stringify(fresh.head().domains.scene.present));
