import { createHost } from '/home/user/_break/b6-soak/Story_director/tests/vendor/story-block/testkit/index.js';
import { createModule } from '/home/user/_break/b6-soak/Story_director/src/v2/module.js';
import { fakeRpgBattle } from '/home/user/_break/b6-soak/Story_director/tests/v2/integration/helpers/fake-rpg.js';
const host = await createHost({ modules: [fakeRpgBattle(), createModule()] });
const lines = [process.argv[2] ?? '~ quest Ghost {i} | step: x'];
for (let i = 0; i < 60; i++) {
  await host.send(`t${i}`, `Text.\n<Changes>\n${lines.map(l => l.replaceAll('{i}', i)).join('\n')}\n</Changes>`);
  const d = host.head().domains.director;
  const msg = host.ctx.chat.at(-1);
  const opsBytes = JSON.stringify(msg.extra.storySuite.ops).length;
  if (i % 10 === 9 || i > 55) console.log(i, 'problems', d.problems.length, 'ops bytes this reply', opsBytes, 'checkpoint', Boolean(msg.extra.storySuite.checkpoint));
}
