// set which modules the instance serves: node exts.mjs Story_block Story_director ...
import fs from 'node:fs';
const EXT = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad/inst/a3/data/default-user/extensions';
export function setExts(list) {
  for (const r of ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta']) { try { fs.unlinkSync(`${EXT}/${r}`); } catch {} }
  for (const r of list) fs.symlinkSync(`/home/user/cell/a3/${r}`, `${EXT}/${r}`);
  return fs.readdirSync(EXT);
}
if (process.argv[1].endsWith('exts.mjs')) console.log(setExts(process.argv.slice(2)));
