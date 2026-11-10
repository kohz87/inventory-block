import { rpgHost, seeded } from './helpers.js';
import { CHARACTER_FILE_VERSION } from '../../../src/v2/party/portable.js';
await seeded(5, async () => {
  const host = await rpgHost();
  const file = { rpgBattleCharacter: CHARACTER_FILE_VERSION, name: 'Ren', level: 1, xp: 0, points: 0, stats: { STR: 35, VIT: 5, AGI: 0, DEX: 5, INT: 0, LUK: 0, CHA: 0 }, skills: [] };
  const r = await host.cmd('creation.import', { character: file });
  console.log(r.ok, r.code ?? '', r.message ?? r.receipt.summary, JSON.stringify(host.q('party.pc')?.stats), host.q('party.pc')?.hp);
  host.close();
});
