import { allHost } from './lib/host.mjs';
const h = await allHost();
const mods = h.registry.modules();
for (const m of mods) {
  const def = h.registry.module(m.id ?? m) ?? m;
  console.log('##', def.id, 'kinds:', Object.entries(def.capture?.kinds ?? {}).map(([k,s]) => k + (s.feature?`[${s.feature}]`:'') + (s.aliases?`(${s.aliases})`:'')).join(' '));
  console.log('   commands:', Object.entries(def.commands ?? {}).map(([k,s]) => k + (s?.feature?`[${s.feature}]`:'') + (s?.internal?'(int)':'')).join(' '));
  console.log('   features:', JSON.stringify(def.features ? Object.keys(def.features) : null));
  console.log('   domains:', Object.keys(def.domains ?? {}).join(' '));
}
console.log(JSON.stringify(h.registry.features?.()).slice(0,3000));
h.close(); process.exit(0);
