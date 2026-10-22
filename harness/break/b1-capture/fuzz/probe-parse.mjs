const { parseChanges, extractBlock, hideBlock, stripBlock } = await import('/home/user/_break/b1-capture/Story_block/src/v2/capture.js');
const cases = [
  '+ item Rope | constructor: x',
  '+ item Rope | Constructor: x',
  '+ item Rope | __proto__: x',
  '+ item Rope | toString: x',
  '+ item Rope | qty: 2 | qty: 3',
  '+ item Rope | note: a: b',
  '+ item Rope | note: 09:00',
  '+ item Rope — a rope — long',
  '+ item Jean-Luc - the name',
  '+ item Rope -',
  '- - item Rope',
  '- + item Rope',
  '- item Rope',
  '-item Rope',
  '+item:Rope',
  '+ item: Rope',
  '* - item Rope',
  '1. + item Rope',
  '1) - coin 5',
  '> + coin 5',
  '**+ coin 5**',
  '`+ coin 5`',
  '+ coin **5**',
  '​+ coin 5',
  '﻿+ coin 5',
  '＋ coin 5',
  '− coin 5',
  '– coin 5',
  '— coin 5',
  '+ ítem Rope',
  '+ İtem Rope',
  '+ ITEM Rope',
  '+ coin\t5',
  '+\tcoin\t5',
  '+ item Rope\t|\tqty:\t2',
  '+ item Rope | qty:2',
  '+ item Rope | qty :2',
  '+ item Rope |qty: 2|note: x',
  '+ item  | qty: 2',
  '+ quest X | goal: Kill 3 rats | reward: 10 gold | step: a | b',
  '<Changes>+ coin 5</Changes>',
  '</ Changes>',
  '<changes/>',
  'None.',
  '(no changes)',
  'none — nothing',
  '- none',
  '+ none',
];
for (const c of cases) {
  const { lines, problems } = parseChanges(c);
  console.log(JSON.stringify(c).padEnd(50), lines.length ? JSON.stringify(lines.map(l => ({ op: l.op, kind: l.kind, name: l.name, text: l.text, labels: Object.fromEntries(Object.entries(l.labels).map(([k, v]) => [k, typeof v === 'function' ? `FUNCTION ${v.name}` : v])) }))) : 'PROBLEM ' + problems[0]?.slice(-60));
}
// constructor check
const r = parseChanges('+ item Rope | constructor: x').lines[0];
console.log('typeof labels.constructor =', typeof r.labels.constructor, Object.hasOwn(r.labels, 'constructor'));
// Blocks
const blk = [
  'Story <Changes>\n+ coin 5\n</Changes> more <Changes>\n+ coin 6\n</Changes>',
  'Story\n```\n<Changes>\n+ coin 5\n</Changes>\n```',
  'Story <!-- <Changes>\n+ coin 5\n</Changes> -->',
  'Story <think><Changes>\n+ coin 5\n</Changes></think>',
  'Story <think><Changes>\n+ coin 5\n</Changes>',
  'Story <thinking>\n<Changes>\n+ coin 5\n</Changes>\n</think>\n<Changes>\n+ coin 6\n</Changes>',
  'Story <Changes>\n<Changes>\n+ coin 5\n</Changes>\n+ coin 6\n</Changes>',
  'Story <Changes\n>\n+ coin 5\n</Changes>',
  'Story <Changes>\n+ item Rope | note: --> boom <b>x</b>\n</Changes>',
  'Story <Changes>\n+ item Rope | note: --!> <img src=x onerror=alert(1)>\n</Changes>',
  'Story <!-- STORY_SUITE_V2 --> <Changes>\n+ coin 5\n</Changes>',
  'Story <!-- STORY_SUITE_V2\n<Changes>\n+ coin 7\n</Changes>\n-->',
  'Story <!-- STORY_SUITE_V2 <Changes>\n+ coin 5\n</Changes>',
  '<Changes>\r\n+ coin 5\r\n</Changes>\r\n',
  'Story <Changes>\n+ coin 5\n</Changes>\n<!-- STORY_SUITE_V2\n<Changes>\n+ coin 8\n</Changes>\n-->',
];
for (const b of blk) {
  const ex = extractBlock(b);
  const hidden = hideBlock(b);
  console.log('---', JSON.stringify(b));
  console.log('   extract:', JSON.stringify(ex));
  console.log('   hidden :', JSON.stringify(hidden));
  console.log('   re-extract after hide:', JSON.stringify(extractBlock(hidden)), ' strip:', JSON.stringify(stripBlock(hidden)));
}
