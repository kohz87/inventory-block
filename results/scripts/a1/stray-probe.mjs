// strayLines probes: prose forms that must never be taken, near-misses that must be STRAY Problems.
const SB = '/home/user/cell/a1/Story_block';
const { strayLines, extractBlock, hideBlock, stripBlock } = await import(`${SB}/src/v2/capture.js`);
const heads = new Set(['+ coin', '- coin', '+ present', '- present', '! encounter', '+ item', '- item', '~ item', '? choice', '~ chatter', '+ xp', '! time', '~ time']);
const B = '\n\n<Changes>\n~ place Bluewatch Village\n</Changes>';
const cases = {
  quoted: `The tavern was loud.\n\n"+ coin 5"\n${B}`,
  quotedCurly: `The tavern was loud.\n\n“+ coin 5”\n${B}`,
  blockquote: `The tavern was loud.\n\n> + coin 5\n${B}`,
  fence: `The tavern was loud.\n\n\`\`\`\n+ coin 5\n\`\`\`\n${B}`,
  fenceTilde: `The tavern was loud.\n\n~~~\n+ coin 5\n~~~\n${B}`,
  indentedCode: `The tavern was loud.\n\n    + coin 5\n${B}`,
  dialogueDash: `Fenna laughed.\n\n- coin 5, she said, is all you get.\n${B}`,
  listNarration: `He listed his take:\n+ coin 5\n+ item Rope\n${B}`,
  listNarrationPara: `He counted.\n\n+ coin 5\n+ item Rope\n${B}`,
  speakerLine: `Fenna: + coin 5\n${B}`,
  italic: `The tavern was loud.\n\n*+ coin 5*\n${B}`,
  html: `The tavern was loud.\n\n<p>+ coin 5</p>\n${B}`,
  details: `<details>\n+ coin 5\n</details>\n${B}`,
  thinkUnclosed: `<think>\nplan: maybe\n+ coin 5\n${B}`,
  thinkingTag: `<thinking>\n+ coin 5\n</thinking>\nThe tavern was loud.${B}`,
  reasoningTag: `<reasoning>\n+ coin 5\n</reasoning>\nThe tavern was loud.${B}`,
  afterBlockProse: `The tavern was loud.${B}\n\n+ coin 5`,
  noBlock: `The tavern was loud.\n\n+ coin 5`,
  numbered: `The tavern was loud.\n\n1. + coin 5\n${B}`,
  star: `The tavern was loud.\n\n* + coin 5\n${B}`,
  table: `| + coin 5 | x |\n${B}`,
  heading: `## + coin 5\n${B}`,
  oocParen: `(OOC: + coin 5)\n${B}`,
  bracketed: `[+ coin 5]\n${B}`,
  nbsp: `The tavern was loud.\n\n+ coin 5\n${B}`,
  fullwidthPlus: `The tavern was loud.\n\n＋ coin 5\n${B}`,
  zw: `The tavern was loud.\n\n+ co​in 5\n${B}`,
  tab: `The tavern was loud.\n\n+\tcoin 5\n${B}`,
  farUp: `+ coin 5\n\nA.\n\nB.\n\nC.\n\nD.${B}`,
  inHiddenComment: `The tavern.\n\n<!-- + coin 5 -->${B}`,
  styleTag: `<style>\n+ coin 5\n</style>${B}`,
  choiceInProse: `She asked what next.\n\n? choice Climb ZQ\n${B}`,
  chatterProse: `Fenna smiled.\n\n~ chatter Fenna: hm\n${B}`,
};
for (const [name, mes] of Object.entries(cases)) {
  let r; try { r = strayLines(mes, heads); } catch (e) { console.log(name, 'THREW', e.message); continue; }
  console.log(name.padEnd(18), 'taken=', JSON.stringify(r.taken.map(t => t.line)), 'problems=', r.problems.length, r.problems.map(p=>p.reason.slice(0,40)).join(' | '));
}
