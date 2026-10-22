// Bad feature declarations: refuse (registry throws a plain refusal) or warn, never an odd throw; the
// host keeps running and other modules' features stay.
const A = process.env.A3ROOT ?? '/home/user/cell/a3';
const { createRegistry, definitionProblems, definitionWarnings } = await import(`${A}/Story_block/src/v2/registry.js`);
const base = extra => ({ id: 'bad', name: 'Bad', version: '0.0.1', ...extra });
const cases = {
    dup: { features: [{ id: 'bad.x', label: 'X' }, { id: 'bad.x', label: 'Y' }] },
    prefix: { features: [{ id: 'other.x', label: 'X' }] },
    prefixNoDot: { features: [{ id: 'badx', label: 'X' }] },
    prefixSub: { features: [{ id: 'bad.x.y', label: 'X' }] },
    upper: { features: [{ id: 'bad.X', label: 'X' }] },
    longLabel: { features: [{ id: 'bad.x', label: 'x'.repeat(61) }] },
    label60: { features: [{ id: 'bad.x', label: 'x'.repeat(60) }] },
    labelSpaces: { features: [{ id: 'bad.x', label: '   ' }] },
    labelPadded: { features: [{ id: 'bad.x', label: ` ${'x'.repeat(60)} ` }] },
    labelAstral: { features: [{ id: 'bad.x', label: '😀'.repeat(31) }] },
    longDescribe: { features: [{ id: 'bad.x', label: 'X', describe: 'd'.repeat(241) }] },
    unknownField: { features: [{ id: 'bad.x', label: 'X', color: 'red' }] },
    otherModuleFeature: { features: [{ id: 'bad.x', label: 'X' }], commands: { 'bad.go': { handler: () => ({}), feature: 'gear.extras' } } },
    otherModuleFeatureKind: { features: [{ id: 'bad.x', label: 'X' }], capture: { kinds: { zz: { grammar: '+ zz X', feature: 'gear.extras' } }, apply: () => ({}) } },
    contextFeatureOther: { features: [{ id: 'bad.x', label: 'X' }], context: { feature: 'gear.extras', static: () => 's' } },
    widgetFeatureOther: { features: [{ id: 'bad.x', label: 'X' }], widgets: { 'bad.w': { render: () => null, feature: 'gear.extras' } } },
    screenFeatureOther: { features: [{ id: 'bad.x', label: 'X' }], screens: [{ id: 'bad/s', title: 'S', mounts: ['tab'], template: '<p>x</p>', feature: 'nope.y' }] },
    featureNull: { features: [{ id: 'bad.x', label: 'X' }], commands: { 'bad.go': { handler: () => ({}), feature: null } } },
    featureObj: { features: [{ id: 'bad.x', label: 'X' }], queries: { 'bad.q': Object.assign(() => 1, { feature: { id: 'bad.x' } }) } },
    labelGetterThrows: { features: [{ id: 'bad.x', get label() { throw new Error('boom'); } }] },
    idGetterThrows: { features: [{ get id() { throw new Error('boom'); }, label: 'X' }] },
    featuresProxy: { features: new Proxy([], { get(t, k) { if (k === 'length') throw new Error('boom'); return t[k]; } }) },
    featureEntryNull: { features: [null] },
    featureSym: { features: [{ id: Symbol('x'), label: 'X' }] },
    labelNumber: { features: [{ id: 'bad.x', label: 7 }] },
    labelObject: { features: [{ id: 'bad.x', label: { toString() { return 'X'; } } }] },
    unknownFieldOnNonObj: { features: [{ id: 'bad.x', label: 'X', __proto__: { inherited: 1 } }] },
    hugeName: { features: [{ id: `bad.${'a'.repeat(100000)}`, label: 'X' }] },
    many: { features: Array.from({ length: 5000 }, (_, i) => ({ id: `bad.f${i}`, label: `F${i}` })) },
    defaultUndefined: { features: [{ id: 'bad.x', label: 'X', default: undefined }] },
    promptNull: { features: [{ id: 'bad.x', label: 'X', prompt: null }] },
    describeNull: { features: [{ id: 'bad.x', label: 'X', describe: null }] },
    hookFeatureGetterThrows: { features: [{ id: 'bad.x', label: 'X' }], hooks: { beforeGenerate: Object.defineProperty(() => [], 'feature', { get() { throw new Error('boom'); }, enumerable: true }) } },
};
for (const [name, extra] of Object.entries(cases)) {
    const def = base(extra);
    const out = { name };
    try { out.problems = definitionProblems(def); } catch (e) { out.problemsThrew = e.message; }
    try { out.warnings = definitionWarnings(def); } catch (e) { out.warningsThrew = e.message; }
    const warns = [];
    const reg = createRegistry({ warn: m => warns.push(m) });
    reg.register({ id: 'gear', name: 'Gear', features: [{ id: 'gear.extras', label: 'Extras' }] });
    const t0 = Date.now();
    try { reg.register(def); out.registered = true; } catch (e) { out.refused = /cannot be registered/.test(e.message) ? 'plain' : `ODD: ${e.message}`; }
    out.ms = Date.now() - t0;
    try { out.features = reg.features().map(f => f.id).length; out.gearOn = reg.featureOn('gear.extras'); reg.contexts(); reg.hooks('beforeGenerate'); } catch (e) { out.afterThrew = e.message; }
    out.warns = warns.length;
    console.log(JSON.stringify(out, (k, v) => (typeof v === 'string' && v.length > 160 ? `${v.slice(0, 160)}…` : v)));
}
