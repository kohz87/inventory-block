const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
console.warn = () => {};
const B = l => `\n\n<Changes>\n${l.join('\n')}\n</Changes>`;
let h = await createHost(); 
h.features.set('story-block.choices', true); h.features.set('story-block.chatter', true);
const disp = () => (h.ctx.chat.at(-1).mes && JSON.stringify(globalThis.__d(h.ctx.chat.at(-1).mes)));
const { displayLines } = await import(`${SB}/src/v2/extras.js`);
globalThis.__d = mes => displayLines(mes, { entryOf: w => h.registry.capture(w), max: 40 });
await h.send('Hi.', 'Road.');
await h.send('Go.', 'The gate.' + B(['? choice A', '? choice B', '? choice C']));
await h.cont(' More.' + B(['? choice D', '? choice E', '~ chatter Fenna: hm', '~ chatter Fenna: hm2', '~ chatter Fenna: hm3']));
console.log('after continue display', disp(), 'problems', h.turn.problems().map(p => p.code + ':' + p.line));
await h.cont(' Even more.' + B(['~ chatter Fenna: hm4']));
console.log('after 2nd continue', disp(), 'problems', h.turn.problems().map(p => p.code + ':' + p.line));
// off then on
h.features.set('story-block.choices', false);
await h.send('Next.', 'The hall.' + B(['? choice X', '? choice Y']));
console.log('off: problems', h.turn.problems().map(p => p.code + ':' + p.line).slice(-2), 'display', disp());
h.features.set('story-block.choices', true);
console.log('on again display', disp());
// stray choice in story with no block, off
h.features.set('story-block.choices', false);
await h.send('Next.', 'The yard.\n\n? choice Z1\n? choice Z2');
console.log('stray while off:', JSON.stringify(h.ctx.chat.at(-1).mes));
h.close();
