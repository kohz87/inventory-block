// c1 harness (from b2-timeline lib/host.mjs): a testkit host with all four modules (Story Block core,
// RPG Battle, Story Director, NPC State Delta's v2 adapter). B2ROOT = the folder holding the four clones.
// allHost({ pack: true }) installs the Ersveil example pack first (shops, recipes, quests, ranks, calendar).
import { readFileSync } from 'node:fs';
const B = process.env.B2ROOT ?? '/home/user/cell/a1';
export const ROOT = B;
const { createHost } = await import(`${B}/Story_block/testkit/index.js`);
const RB = await import(`${B}/rpg_battle/src/v2/module.js`);
const SD = await import(`${B}/Story_director/src/v2/module.js`);
const NSD = await import(`${B}/npc_state_delta/src/storysuite-v2.js`);
export const persist = await import(`${B}/Story_block/src/v2/persist.js`);
export const storeMod = await import(`${B}/Story_block/src/v2/store.js`);
export const fakeSt = await import(`${B}/Story_block/testkit/fake-st.js`);
export const seededMod = await import(`${B}/Story_block/tests/v2/qa/helpers/seeded.js`);
export const PACK_TEXT = readFileSync(`${B}/Story_block/examples/packs/ersveil-bluewatch/pack.json`, 'utf8');

let packedSettings = null;
async function packSettings() {
    if (packedSettings) return structuredClone(packedSettings);
    const probe = await createHost({ settings: {} });
    const done = await probe.packs.packs.install(PACK_TEXT, { origin: 'pack.json' });
    if (!done.ok) throw new Error('pack install failed: ' + JSON.stringify(done.errors));
    packedSettings = structuredClone(probe.ctx.extensionSettings.storySuite);
    probe.close();
    return structuredClone(packedSettings);
}

// NSD's meter settings (stages, a custom meter) for nsdSettings: true. NSD reads its settings only through the sdk
// it registered with, so then it registers itself the live way (adapter.start → sdk.registerModule).
export const NSD_SETTINGS = { stages: [{ meter: 'trust', at: 10, name: 'Warming' }, { meter: 'trust', at: 30, name: 'Trusted' }, { meter: 'trust', at: -10, name: 'Wary' },
    { meter: 'affection', at: 15, name: 'Fond' }, { meter: 'bond', at: 20, name: 'Close' }, { meter: 'bond', at: -20, name: 'Estranged' }],
    customMeters: [{ name: 'Bond', min: -50, max: 50, start: 0 }], changeCap: 15 };

export async function allHost({ st = {}, settings = null, nsdNpcs = () => [], pack = false, nsdSettings = false } = {}) {
    let sdk = null;
    const rb = RB.createModule({ settings: () => sdk?.settings(RB.MODULE_ID) ?? {} });
    const sd = SD.createModule({ host: { settings: id => sdk?.settings?.(id) ?? null, substitute: t => sdk?.substitute?.(t) } });
    const adapter = NSD.createStorySuiteV2Adapter({ suiteApi: { npcs: nsdNpcs }, delta: () => ({ isEnabled: () => true, getNpc: () => null }), host: () => null, doc: null, timers: {}, logger: { warn() {} } });
    const nsdDef = adapter.definition ?? null;
    const modules = [rb, sd];
    if (nsdDef) modules.push(nsdDef);
    let s = pack ? { ...(await packSettings()), ...(settings ?? {}) } : settings;
    if (nsdSettings) {
        s = structuredClone(s ?? {});
        s.modules ??= {};
        s.modules['npc-state-delta'] = { ...(s.modules['npc-state-delta'] ?? {}), ...structuredClone(NSD_SETTINGS) };
        modules.pop();   // NSD registers itself below
    }
    const host = await createHost({ modules, st, ...(s ? { settings: s } : {}) });
    sdk = host.sdk;
    globalThis.StoryBlock = { apiVersion: 2, ready: Promise.resolve(sdk), sdk };
    if (nsdSettings) {
        const live = NSD.createStorySuiteV2Adapter({ suiteApi: { npcs: nsdNpcs }, delta: () => ({ isEnabled: () => true, getNpc: () => null }), host: () => globalThis.StoryBlock, doc: null, timers: globalThis, logger: { warn() {} }, loadEmptyCast: async () => null });
        live.start();
        if (!(await live.settled())) throw new Error('NSD did not register with the testkit sdk');
        const close = host.close;
        host.close = () => { try { live.stop(); } catch { /* */ } close(); };
    }
    host.nsd = !!nsdDef;
    return host;
}
