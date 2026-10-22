import { suiteHost } from './suite-host.mjs';
const h = await suiteHost();
for (const c of h.registry.contexts()) { console.log('##', c.moduleId); for (const k of c.kinds) console.log(k.kind.padEnd(12), k.grammar.replace(/\n/g,' / ')); }
console.log('features', JSON.stringify(h.registry.features().map(f=>[f.id??f.key, f.default??f.on])));
h.close();
