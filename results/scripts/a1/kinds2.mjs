import { suiteHost } from '/home/user/cell/a1/Story_block/tests/v2/break/helpers/suite.js';
const h = await suiteHost({ pack: true });
for (const c of h.registry.contexts()) for (const k of c.kinds) console.log(c.moduleId, k.kind, '::', k.grammar.replace(/\n/g,' / '));
console.log(Object.keys(h.sdk).join(' '));
console.log(JSON.stringify(h.sdk.features?.()).slice(0,3000));
h.close();
