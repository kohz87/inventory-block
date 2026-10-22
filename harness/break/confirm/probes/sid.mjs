import { suiteHost } from '../fuzz/helpers/suite-final.js';
const h = await suiteHost({ seed: 5 }); await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
for (let i = 0; i < 4; i += 1) await h.send('x', h.reply('r', ['! time +1h']));
console.log(h.ctx.chat.map(m => m.extra?.storySuite?.sid ?? '-').join(' '));
h.close();
