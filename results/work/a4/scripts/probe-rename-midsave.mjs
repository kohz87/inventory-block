// The open chat is renamed while Story Block's save of a change is still on its way (it reaches the
// server after the rename: 'reorder'), or answered late ('hang', written on arrival), or failing.
import { makeServer, allHost, openFromServer, fileHead, renameChat, sleep, J } from './lib.mjs';
console.warn = () => {};
const server = makeServer();
const h = await allHost({ server });
const { ctx, sdk, store } = h;
const pres = x => J(x?.domains?.scene?.present);
let n = 0;
for (const mode of ['hang', 'reorder', '500', 'hangfail']) {
  for (const event of [true]) {
    const id = `A${n++}`;
    await openFromServer(h, server, id);
    await sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
    await h.send('Hi', 'Hello.\n<Changes>\n+ item Rope\n</Changes>');
    await store.flush();
    server.mode = mode; server.fails = 1;
    const c = sdk.command('scene.present', { add: 'Ann' });
    await sleep(1);
    await renameChat(h, server, `${id}-renamed`, { event });
    server.release();
    await c;
    await sleep(2500);
    await store.flush().catch(e => console.log('flush', e.message));
    const live = pres(h.head());
    console.log(mode, 'event', event, '| live', live, '| renamed file', pres(fileHead(h, server, `${id}-renamed`)), '| old-name file exists', server.files.has(id), pres(fileHead(h, server, id)), '| dirty', store.dirty());
  }
}
process.exit(0);
