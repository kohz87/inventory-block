// Card edit on a pristine chat while the only change is still inside the 400 ms window / its save failed / hung.
import { makeServer, allHost, openFromServer, fileHead, cardEdit, sleep, J } from './lib.mjs';
console.warn = () => {};
const server = makeServer();
const h = await allHost({ server });
const { ctx, sdk, store } = h;
const pres = x => J(x?.domains?.scene?.present);
let n = 0;
for (const how of ['window', 'fail', 'reorder', 'failAll']) {
  const id = `G${n++}`;
  await openFromServer(h, server, id);
  if (how === 'window') await h.bus.command('scene.present', { add: 'Ann' }, { cause: 'ui' });
  else if (how === 'fail') { server.mode = '500'; server.fails = 1; await sdk.command('scene.present', { add: 'Ann' }); }
  else if (how === 'failAll') { server.mode = '500'; server.fails = 1000; await sdk.command('scene.present', { add: 'Ann' }); }
  else { server.mode = 'reorder'; server.fails = 1; void sdk.command('scene.present', { add: 'Ann' }); await sleep(1); }
  const edited = await cardEdit(h);
  server.release();
  if (how === 'failAll') { await sleep(2500); server.fails = 0; }
  await sleep(4000);
  await store.flush().catch(e => console.log('flush', e.message));
  const live = pres(h.head());
  await openFromServer(h, server, id);
  console.log(how, 'pristine replaced?', edited, 'live after edit', live, 'file', pres(h.head()), 'tainted', ctx.chatMetadata.tainted);
}
process.exit(0);
