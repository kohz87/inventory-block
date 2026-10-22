import { started } from '../Story_block/tests/v2/break/helpers/suite-b5b.js';
import { estimateTokens } from '../Story_block/src/v2/prompt.js';
for (const len of [5, 200, 2000, 100000]) {
  const host = await started();
  host.ctx.name1 = 'A'.repeat(len);
  await host.send('look', host.reply('Fenna offers work.', ['+ hook Lost Cat — find it | giver: Fenna | reward: 5 mark', '+ hook Rats — kill them | giver: Fenna | reward: 5 mark']));
  const t = Date.now();
  await host.send('next', host.reply('Quiet.'));
  const r = host.st.requests.at(-1);
  const tail = r.chat.filter(m => m.role === 'system').slice(1).map(m => m.content).join('\n');
  const parts = host.turn.lastParts?.() ?? null;
  console.log('name', len, 'static tok', estimateTokens(r.chat[0].content), 'tail tok', estimateTokens(tail), 'reply ms', Date.now() - t);
  host.close();
}
