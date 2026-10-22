import { started } from '/home/user/cell/a2/rpg_battle/tests/v2/break/helpers/suite.js';
console.warn = () => {};
const host = await started({ seed: 5 });
const b = host.head().domains.bestiary;
console.log(JSON.stringify(b)?.slice(0, 600));
try { console.log(JSON.stringify(host.q('packs.content', { kind: 'creatures' }))?.slice(0, 300)); } catch (e) { console.log(e.message); }
host.close();
