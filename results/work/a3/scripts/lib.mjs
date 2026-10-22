// a3 features-toggle fuzz: a testkit host with all four modules plus two synthetic modules (fz, fy)
// that declare features owning a capture kind, a command, a query, hooks, context parts (static + tail),
// a tab, prompt:true, and state in their own domains.
const A = process.env.A3ROOT ?? '/home/user/cell/a3';
const { createHost } = await import(`${A}/Story_block/testkit/index.js`);
const RB = await import(`${A}/rpg_battle/src/v2/module.js`);
const SD = await import(`${A}/Story_director/src/v2/module.js`);
const NSD = await import(`${A}/npc_state_delta/src/storysuite-v2.js`);
export const storeMod = await import(`${A}/Story_block/src/v2/store.js`);
export const persist = await import(`${A}/Story_block/src/v2/persist.js`);
export const seededMod = await import(`${A}/Story_block/tests/v2/qa/helpers/seeded.js`);
export const notes = await import(`${A}/Story_block/src/v2/reply-notes.js`);
export const turnMod = await import(`${A}/Story_block/src/v2/turn.js`);

// Every hook call: { name, feature, on (at call time) }.
export const H = { calls: [], block: false, api: null };
const on = id => H.api?.(id) ?? true;
const hook = (name, feature, fn) => Object.assign((...args) => { H.calls.push({ name, feature, on: on(feature) }); return fn(...args); }, { feature });

export const FZ_TAIL = 'FZ-TAIL-LINE';
export function fzModule() {
    return {
        id: 'fz', name: 'Fuzz', version: '0.0.1',
        features: [
            { id: 'fz.kind', label: 'Ticks', describe: 'tick lines' },
            { id: 'fz.cmd', label: 'Pokes', default: false },
            { id: 'fz.flag', label: 'Flag', prompt: true },
            { id: 'fz.tail', label: 'Tail', default: false },
        ],
        domains: { fzk: { initial: () => ({ ticks: {} }) }, fzc: { initial: () => ({ pokes: 0, tries: {} }) } },
        commands: {
            'fz.poke': { handler: ctx => { ctx.draft('fzc').pokes += 1; return { summary: 'Poked.', narrate: false }; }, feature: 'fz.cmd' },
            'fz.free': ctx => {
                let code = 'ran';
                try { ctx.call('fz.poke', {}); } catch (error) { code = error.code ?? 'threw'; }
                const peek = ctx.query('fz.peek');
                const d = ctx.draft('fzc');
                d.tries[`t${Object.keys(d.tries).length}`] = { code, peek: peek === null ? 'null' : 'obj', flag: ctx.feature('fz.cmd') };
                return { summary: 'Tried.', narrate: false, data: { code, peek } };
            },
        },
        queries: { 'fz.peek': Object.assign(state => ({ pokes: state.domains.fzc?.pokes ?? 0 }), { feature: 'fz.cmd' }) },
        capture: {
            kinds: {
                tick: { grammar: '~ tick Name | n: 1-9', feature: 'fz.kind' },
                tock: { grammar: '+ tock Name' },
            },
            apply(ctx, line) {
                if (line.kind === 'tick') {
                    const d = ctx.draft('fzk');
                    d.ticks[line.name] = Number(line.labels?.n ?? line.fields?.n ?? 1) || 1;
                } else {
                    const d = ctx.draft('fzc');
                    d.tries[`tock-${line.name}`] = { code: 'tock' };
                }
                return { summary: `${line.kind} ${line.name}`, narrate: false };
            },
        },
        context: {
            static: () => (on('fz.flag') ? 'FZ static: flag on.' : 'FZ static: base.'),
            tail: view => ({ lines: [`FZ pokes ${view.state?.domains?.fzc?.pokes ?? 0}`], optional: [] }),
            parts: [
                { feature: 'fz.kind', static: () => 'FZ ticks: write a tick line when a counter moves.', tail: view => ({ lines: [`FZ ticks ${Object.keys(view.state?.domains?.fzk?.ticks ?? {}).length}`] }) },
                { feature: 'fz.tail', tail: () => ({ lines: [FZ_TAIL] }) },
            ],
            budget: 200,
        },
        hooks: {
            beforeGenerate: hook('beforeGenerate', 'fz.cmd', () => ['FZ cue: pokes on.']),
            canGenerate: hook('canGenerate', 'fz.cmd', () => true),
            afterReply: hook('afterReply', 'fz.cmd', () => {}),
        },
        tabs: [{ id: 'fz-tab', title: 'FZ', render: el => { el.textContent = 'fz'; }, feature: 'fz.cmd' }],
    };
}

// fy: a whole-context feature (context.feature) whose static text sits only in a part without its own
// feature, an onBlocked hook under a feature, a canGenerate (no feature) that blocks when H.block, and
// an item.define hook under a feature.
export function fyModule() {
    return {
        id: 'fy', name: 'Fuzz Y', version: '0.0.1',
        features: [
            { id: 'fy.all', label: 'Y all' },
            { id: 'fy.hooks', label: 'Y hooks', default: false },
        ],
        domains: { fyd: { initial: () => ({ asks: {} }) } },
        commands: {
            'fy.ask': ctx => {
                let code = 'ran';
                try { ctx.call('fz.poke', {}); } catch (error) { code = error.code ?? 'threw'; }
                ctx.draft('fyd').asks[`a${ctx.read('fyd') ? Object.keys(ctx.read('fyd').asks).length : 0}`] = { code, peek: ctx.query('fz.peek') === null ? 'null' : 'obj' };
                return { summary: 'Asked.', narrate: false };
            },
        },
        context: {
            feature: 'fy.all',
            parts: [{ static: () => 'FY static part text.', tail: () => ({ lines: ['FY tail.'] }) }],
            budget: 100,
        },
        hooks: {
            canGenerate: () => (H.block ? { ok: false, reason: 'FY says wait.' } : true),
            onBlocked: hook('onBlocked', 'fy.hooks', () => {}),
            'item.define': hook('item.define', 'fy.hooks', () => {}),
        },
    };
}

export async function allHost({ st = {}, settings = null, extra = [fzModule(), fyModule()] } = {}) {
    let sdk = null;
    const rb = RB.createModule({ settings: () => sdk?.settings(RB.MODULE_ID) ?? {} });
    const sd = SD.createModule({ host: { settings: id => sdk?.settings?.(id) ?? null, substitute: t => sdk?.substitute?.(t) } });
    const adapter = NSD.createStorySuiteV2Adapter({ suiteApi: { npcs: () => [] }, delta: () => ({ isEnabled: () => true, getNpc: () => null }), host: () => null, doc: null, logger: { warn() {} } });
    const modules = [rb, sd];
    if (adapter.definition) modules.push(adapter.definition);
    modules.push(...extra);
    const host = await createHost({ modules, st, callModel: async () => 'none', ...(settings ? { settings } : {}) });
    sdk = host.sdk;
    H.api = id => host.registry.featureOn(id);
    globalThis.StoryBlock = { apiVersion: 2, ready: Promise.resolve(sdk), sdk };
    return host;
}
