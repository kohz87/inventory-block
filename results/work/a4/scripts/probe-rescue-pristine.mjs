// Does a change rescued into a pristine chat's file mark that chat as used (tainted)?
import { makeServer, allHost, openFromServer, fileHead, cardEdit, sleep, J } from './lib.mjs';
console.warn = () => {};
const server = makeServer();
const h = await allHost({ server });
const { ctx, sdk, store } = h;
const pres = x => J(x?.domains?.scene?.present);
for (const variant of ['bus-switch', 'fail-switch']) {
  const G = `G-${variant}`;
  await openFromServer(h, server, G);
  if (process.env.PREFLUSH) await store.flush().catch(() => {});
  server.log.length = 0;
  if (variant === 'bus-switch') {
    const r = await h.bus.command('scene.present', { add: 'Ann' }, { cause: 'ui' });
    console.log(variant, 'cmd', r.ok, 'dirty', store.dirty());
  } else {
    server.mode = '500'; server.fails = 1;
    const r = await sdk.command('scene.present', { add: 'Ann' });
    console.log(variant, 'cmd', r.ok, 'dirty', store.dirty(), 'meta', J(ctx.chatMetadata));
  }
  await openFromServer(h, server, `other-${variant}`);   // another chat opened before the save
  await store.flush().catch(e => console.log('flush err', e.message));
  await sleep(2500);
  console.log('  server log', server.log.join(' '));
  const f = server.files.get(G);
  console.log(variant, 'G header', J(f?.[0]), 'present on disk', pres(fileHead(h, server, G)));
  await openFromServer(h, server, G);
  console.log(variant, 'reopened present', pres(h.head()), 'tainted', ctx.chatMetadata.tainted);
  const edited = await cardEdit(h);
  h.store.rebuild();
  console.log(variant, 'card edit pristine?', edited, 'present after', pres(h.head()), 'disk', pres(fileHead(h, server, G)));
}
h.close(); process.exit(0);
