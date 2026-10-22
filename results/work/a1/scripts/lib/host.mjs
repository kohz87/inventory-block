// b2-timeline harness: a testkit host with all four modules (Story Block core, RPG Battle,
// Story Director, NPC State Delta's v2 adapter).
const B = process.env.B2ROOT ?? '/home/user/_break/b2-timeline';
const { createHost } = await import(`${B}/Story_block/testkit/index.js`);
const RB = await import(`${B}/rpg_battle/src/v2/module.js`);
const SD = await import(`${B}/Story_director/src/v2/module.js`);
const NSD = await import(`${B}/npc_state_delta/src/storysuite-v2.js`);
export const persist = await import(`${B}/Story_block/src/v2/persist.js`);
export const storeMod = await import(`${B}/Story_block/src/v2/store.js`);
export const fakeSt = await import(`${B}/Story_block/testkit/fake-st.js`);
export const seededMod = await import(`${B}/Story_block/tests/v2/qa/helpers/seeded.js`);

export async function allHost({ st = {}, settings = null, nsdNpcs = () => [] } = {}) {
    let sdk = null;
    const rb = RB.createModule({ settings: () => sdk?.settings(RB.MODULE_ID) ?? {} });
    const sd = SD.createModule({ host: { settings: id => sdk?.settings?.(id) ?? null, substitute: t => sdk?.substitute?.(t) } });
    const adapter = NSD.createStorySuiteV2Adapter({ suiteApi: { npcs: nsdNpcs }, delta: () => ({ isEnabled: () => true, getNpc: () => null }), host: () => null, doc: null, logger: { warn() {} } });
    const nsdDef = adapter.definition ?? null;
    const modules = [rb, sd];
    if (nsdDef) modules.push(nsdDef);
    const host = await createHost({ modules, st, ...(settings ? { settings } : {}) });
    sdk = host.sdk;
    globalThis.StoryBlock = { apiVersion: 2, ready: Promise.resolve(sdk), sdk };
    host.nsd = !!nsdDef;
    return host;
}
