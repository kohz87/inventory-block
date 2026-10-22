// A change whose save failed, then SillyTavern deletes an earlier message (and saves the chat itself, with
// the record), then another chat is opened: the rescue looks the change up by its old index.
import { makeServer, allHost, openFromServer, fileHead, freshHead, sleep, J } from './lib.mjs';
const told = [];
console.warn = (...a) => told.push(a.map(x => String(x?.message ?? x)).join(' ').slice(0, 200));
const server = makeServer();
const h = await allHost({ server });
const { ctx, sdk, store, st } = h;
const pres = x => J(x?.domains?.scene?.present);
const variant = process.argv[2] ?? 'delete-before';
await openFromServer(h, server, 'A');
await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
for (let i = 1; i <= 3; i++) await h.send(`u${i}`, `r${i}\n<Changes>\n+ item Rope\n</Changes>`);
await store.flush();
told.length = 0;
server.mode = '500'; server.fails = 1;
await sdk.command('scene.present', { add: 'Ann' });
const want = J(h.head());
if (variant === 'delete-before') { await st.deleteMessage(1); await ctx.saveChat(); }
const wantAfterDelete = J(h.head());
await openFromServer(h, server, 'B');
await store.flush().catch(e => console.log('flush', e.message));
for (let i = 0; i < 40 && store.dirty(); i++) await sleep(1000);
const disk = fileHead(h, server, 'A');
console.log(variant, 'dirty', store.dirty(), 'A file present', pres(disk), 'file == live at leave', J(disk) === wantAfterDelete, 'A file msgs', server.files.get('A').length - 1);
console.log('told', J(told.filter(t => /Story/.test(t) && !/that chat's file$/.test(t))));
process.exit(0);
