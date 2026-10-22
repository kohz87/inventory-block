import { suiteHost } from '/home/user/cell/a1/Story_block/tests/v2/break/helpers/suite.js';
const h = await suiteHost({ pack: true });
for (const c of h.registry.contexts()) console.log(c.moduleId, '|', c.kinds.map(k => k.kind).join(','));
for (const m of h.registry.modules()) console.log('cmds', m.id ?? m, Object.keys(m.commands ?? {}).join(','));
h.close();
