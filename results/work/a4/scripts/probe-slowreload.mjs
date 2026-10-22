// An unsaved change (its save failed) while the same chat is read again slowly (> 10 s with the chat array empty).
import { makeServer, allHost, openFromServer, fileHead, sleep, J } from './lib.mjs';
const told = [];
console.warn = (...a) => told.push(a.map(String).join(' ').slice(0, 160));
const server = makeServer();
const h = await allHost({ server });
const { ctx, sdk, store } = h;
const pres = x => J(x?.domains?.scene?.present);
const LOAD = Number(process.argv[2] ?? 11000);
await openFromServer(h, server, 'A');
await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
await h.send('Hi', 'Hello.');
await store.flush();
server.mode = '500'; server.fails = 1;
await sdk.command('scene.present', { add: 'Ann' });
console.log('dirty', store.dirty(), 'live', pres(h.head()));
// SillyTavern reloadCurrentChat: clearChat empties the array in place, then getChat (slow) fills it.
ctx.chat.splice(0, ctx.chat.length);
await sleep(LOAD);
const [header, ...messages] = structuredClone(server.files.get('A'));
ctx.chat.push(...messages);
await h.st.eventSource.emit('chat_id_changed', 'A');
await sleep(3000);
await store.flush().catch(e => console.log('flush', e.message));
console.log(`load ${LOAD} ms: dirty`, store.dirty(), 'live', pres(h.head()), 'file', pres(fileHead(h, server, 'A')), 'told', J(told.filter(t => /Story/.test(t))));
process.exit(0);
