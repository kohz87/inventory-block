import { createHost } from '../Story_block/testkit/index.js';
const N = 20000;
const host = await createHost();
let t = Date.now();
await host.send('go', `The road is quiet.${' '.repeat(N)}x\n\n<Changes>\n+ item Rope | qty: 1\n</Changes>`);
console.log('first', Date.now() - t);
for (let i = 0; i < 3; i++) { t = Date.now(); await host.send('next', `Fine.\n\n<Changes>\n+ item Rope | qty: 1\n</Changes>`); console.log('later reply', Date.now() - t); }
t = Date.now(); host.store.rebuild(); console.log('rebuild', Date.now() - t);
host.close();
