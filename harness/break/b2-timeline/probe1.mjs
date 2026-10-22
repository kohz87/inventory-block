import { allHost } from './lib/host.mjs';
const h = await allHost();
console.log('modules', h.registry.modules?.().map?.(m=>m.id) ?? Object.keys(h.registry));
for (const c of h.registry.contexts()) console.log(c.moduleId ?? c.id, c.kinds.map(k => k.grammar));
const r = await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
console.log('create', r.ok, r.message);
const g = await h.send('hi', 'Story.\n<Changes>\n+ item Rope | qty: 2\n+ coin 5\n~ place Bluewatch | kind: settlement\n</Changes>');
console.log(g.index, h.turn.problems().map(p=>p.message));
console.log(JSON.stringify(h.head()).length, Object.keys(h.head().domains));
