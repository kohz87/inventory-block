import { createHost } from '../Story_block/testkit/index.js';
let warns = 0; console.warn = () => { warns += 1; };
const N = 20000;
const replies = {
  thinkOpens: `${'<think>'.repeat(N)}\nThe road.\n\n<Changes>\n+ item Rope | qty: 1\n</Changes>`,
  thinkPlain: `${'<think> '.repeat(N)}The road.`,
  junkLines: `The road.\n\n<Changes>\n${'x\n'.repeat(100000)}</Changes>`,
};
for (const [k, text] of Object.entries(replies)) {
  const host = await createHost();
  warns = 0;
  let t = Date.now(); await host.send('go', text); const first = Date.now() - t;
  t = Date.now(); await host.send('next', 'Fine.'); const next = Date.now() - t;
  t = Date.now(); await host.send('next', 'Fine.'); const next2 = Date.now() - t;
  console.log(k.padEnd(12), text.length, 'first', first, 'next', next, next2, 'warns', warns, 'problems', host.turn.problems?.().length ?? '?');
  host.close();
}
