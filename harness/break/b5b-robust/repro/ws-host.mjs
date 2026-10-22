import { createHost } from '../Story_block/testkit/index.js';
import { extractBlock, stripBlock, hideBlock, parseChanges } from '../Story_block/src/v2/capture.js';
const N = Number(process.argv[2] ?? 20000);
const cases = {
  storySpaces: `The road is quiet.${' '.repeat(N)}x\n\n<Changes>\n+ item Rope | qty: 1\n</Changes>`,
  storyNewlines: `The road is quiet.${'\n'.repeat(N)}x\n\n<Changes>\n+ item Rope | qty: 1\n</Changes>`,
  blockNewlines: `The road is quiet.\n\n<Changes>\n+ item Rope | qty: 1${'\n'.repeat(N)}x\n</Changes>`,
  nameSpaces: `Quiet.\n\n<Changes>\n+ item Rope${' '.repeat(N)}x | qty: 1\n</Changes>`,
  labelSpaces: `Quiet.\n\n<Changes>\n+ item Rope | qty${' '.repeat(N)}x\n</Changes>`,
  dashes: `Quiet.\n\n<Changes>\n+ item Rope | qty: 1\n</Changes>\n${'-'.repeat(N)}x`,
};
for (const [k, text] of Object.entries(cases)) {
  const host = await createHost();
  const t = Date.now();
  await host.send('go', text);
  const ms = Date.now() - t;
  host.close();
  console.log(k.padEnd(14), N, ms + 'ms');
}
