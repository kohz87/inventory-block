const { strayLines } = await import('/home/user/cell/a1/Story_block/src/v2/capture.js');
const heads = new Set(['+ coin', '+ present']);
for (const m of ['Story.\n\n<!-- author note\n+ coin 5\n-->\n\n<Changes>\n</Changes>', 'Story.\n\n<div style="display:none">\n+ coin 5\n</div>', 'Story.\n\n<span title="\n+ coin 5\n">x</span>']) console.log(JSON.stringify(strayLines(m, heads).taken.map(t => t.line)));
