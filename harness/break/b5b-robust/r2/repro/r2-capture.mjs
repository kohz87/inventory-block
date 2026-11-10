import { createHost } from '../Story_block/testkit/index.js';
import { extractBlock, stripBlock, hideBlock, parseChanges, withoutReasoning, cutLine, continuation } from '../Story_block/src/v2/capture.js';
const ms = fn => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const N = Number(process.argv[2] ?? 10000);
const inputs = {
  closesOneLine: `Story.\n<Changes>\n${'x </Changes>'.repeat(N)}\n</Changes>`,
  opensOneLine: `Story.\n${'<Changes>'.repeat(N)}`,
  thinkOpens: `${'<think>'.repeat(N)}\nStory.\n<Changes>\n+ item Rope\n</Changes>`,
  thinkingClose: `${'<thinking>'.repeat(N)}</think>`,
  hiddenOpens: `${'<!-- STORY_SUITE_V2 '.repeat(N)}`,
  dashesComment: `Story.\n<Changes>\n+ item Rope — ${'-'.repeat(N * 10)}\n</Changes>`,
  junkLines: `Story.\n<Changes>\n${'x\n'.repeat(N * 5)}</Changes>`,
  kindSpaces: `Story.\n<Changes>\n${('+ item' + ' '.repeat(1990) + 'x\n').repeat(150)}</Changes>`,
  tabsBlank: `Story.\n<Changes>\n+ item Rope${'\t \r\n'.repeat(N)}</Changes>`,
};
for (const [k, text] of Object.entries(inputs)) {
  const r = { len: text.length };
  r.extract = ms(() => extractBlock(text)); r.strip = ms(() => stripBlock(text)); r.hide = ms(() => hideBlock(text)); r.cut = ms(() => cutLine(text));
  const body = extractBlock(text) ?? ''; r.parse = ms(() => parseChanges(body));
  r.cont = ms(() => continuation(text.slice(0, text.length >> 1).replace(/ /g, ''), text));
  console.log(k.padEnd(14), JSON.stringify(Object.fromEntries(Object.entries(r).map(([a, b]) => [a, Math.round(b)]))));
}
