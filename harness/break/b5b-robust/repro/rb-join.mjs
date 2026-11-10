import { started } from '../Story_block/tests/v2/break/helpers/suite-b5b.js';
for (const n of [0, 20000, 40000]) {
  const host = await started();
  const t = Date.now();
  await host.send('Hi.', host.reply('Brecht asks to come.', [`+ join Brecht — a guard | level: 2 | skills: Slash${' '.repeat(n)}x`]));
  console.log(n, Date.now() - t, 'ms');
  host.close();
}
