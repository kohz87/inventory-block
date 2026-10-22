// A Story Block save whose answer never comes: does the next generation / UI command wait for it forever?
import { makeServer, allHost, openFromServer, sleep, J } from './lib.mjs';
console.warn = () => {};
const server = makeServer();
const h = await allHost({ server });
const { ctx, sdk, store } = h;
await openFromServer(h, server, 'A');
await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
// next save: the server never answers (no auto release)
server.fetch0 = server.fetch;
let pending = 0;
globalThis.fetch = (url, init) => { if (url.endsWith('/save') && server.never) { pending++; return new Promise(() => {}); } return server.fetch0(url, init); };
server.never = true;
const t0 = Date.now();
const c = sdk.command('scene.present', { add: 'Ann' }).then(r => `command answered ${r.ok} after ${Date.now() - t0} ms`);
const g = h.send('Hi', 'Hello.\n<Changes>\n+ item Rope\n</Changes>').then(r => `generation finished after ${Date.now() - t0} ms, reply at ${r.index}`);
const out = await Promise.race([Promise.all([c, g]), sleep(20000).then(() => 'still waiting after 20 s')]);
console.log(J(out), 'pending saves', pending, 'chat len', ctx.chat.length, 'requests built', h.st.requests.length);
process.exit(0);
