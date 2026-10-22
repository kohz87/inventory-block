// a2 probe 4: Story Director (+ Story Block + Ersveil pack), no RPG Battle: a pack quest re-opened and closed on the story's word, reply after reply.
import { readFileSync } from 'node:fs';
const ROOT = '/home/user/cell/a2';
const { createHost } = await import(`${ROOT}/Story_block/testkit/index.js`);
const SD = await import(`${ROOT}/Story_director/src/v2/module.js`);
const RB = await import(`${ROOT}/rpg_battle/src/v2/module.js`);
const PACK = readFileSync(`${ROOT}/Story_block/examples/packs/ersveil-bluewatch/pack.json`, 'utf8');
console.warn = () => {};
const withRB = process.argv[2] === 'rb';
let sdk = null;
const probe = await createHost({ settings: {} });
await probe.packs.packs.install(PACK, { origin: 'pack.json' });
const settings = structuredClone(probe.ctx.extensionSettings.storySuite); probe.close();
const sd = SD.createModule({ host: { settings: id => sdk?.settings(id) ?? null, substitute: t => sdk?.substitute(t) } });
const mods = [sd];
if (withRB) mods.push(RB.createModule({ settings: () => sdk?.settings(RB.MODULE_ID) ?? {} }));
const host = await createHost({ settings, modules: mods });
sdk = host.sdk; globalThis.StoryBlock = { apiVersion: 2, ready: Promise.resolve(sdk), sdk };
if (withRB) await sdk.command('party.create', { name: 'Wessel', preset: 'fighter' });
const reply = (t, l) => `${t}\n\n<Changes>\n${l.join('\n')}\n</Changes>`;
const coin = () => host.head().domains.inventory.wallets?.party?.coin ?? 0;
await host.send('Look.', reply('Bluewatch.', ['~ place Bluewatch Village | kind: settlement']));
console.log('start', coin(), JSON.stringify(sdk.query('inventory.storyBudget')));
for (let i = 0; i < 5; i++) {
  const c0 = coin();
  await host.send('Take the job.', reply('Fenna posts it.', ['+ quest Granary Rats — clear the granary | giver: Fenna']));

  await host.send('Done.', reply('The rats are gone.', ['~ quest Granary Rats | met: yes', '- quest Granary Rats — turned in', '+ coin 400']));
  console.log('round', i, 'gain', coin() - c0, 'budget', JSON.stringify(sdk.query('inventory.storyBudget')), 'problems', JSON.stringify(host.turn?.problems?.() ?? []).slice(0, 300));
}
const receipts = sdk.receipts().map(r => r.receipt.summary).filter(s => /Granary|reward|turns in/i.test(s));
console.log(receipts.slice(-6).join('\n'));
host.close();
