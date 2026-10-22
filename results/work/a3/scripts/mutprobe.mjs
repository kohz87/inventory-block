// A module's definition changed after it registered (a feature label getter that throws later, a
// label replaced, a feature pushed): does anything throw out of the host's reader paths?
import { allHost, fzModule } from './lib.mjs';
console.warn = () => {};
for (const how of ['labelGetterLater', 'labelChanged', 'pushed', 'featuresReplaced']) {
    const def = fzModule();
    let n = 0;
    if (how === 'labelGetterLater') Object.defineProperty(def.features[0], 'label', { get() { if (++n > 3) throw new Error('boom'); return 'Ticks'; }, enumerable: true });
    const h = await allHost({ extra: [def] });
    await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' });
    if (how === 'labelChanged') def.features[0].label = 7;
    if (how === 'pushed') def.features.push({ id: 'fz.late', label: 'Late' });
    if (how === 'featuresReplaced') def.features = null;
    const out = { how };
    for (const [name, fn] of Object.entries({
        features: () => h.sdk.features().length,
        featureOn: () => h.sdk.feature('fz.kind'),
        send: () => h.send('a', 'B.\n<Changes>\n~ tick A | n: 2\n</Changes>'),
        command: () => h.sdk.command('fz.poke', {}),
        set: () => h.features.set('fz.kind', false),
        list: () => h.features.list().length,
    })) { try { const v = await fn(); out[name] = v?.ok ?? (typeof v === 'object' ? 'obj' : v); } catch (e) { out[name] = `THREW ${e.message}`; } }
    out.ticks = JSON.stringify(h.head().domains.fzk);
    console.log(JSON.stringify(out));
    h.close();
}
