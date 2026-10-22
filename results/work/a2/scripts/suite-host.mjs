// A combined Story Suite v2 host on Story Block's own (latest) testkit: SB core (scene, inventory,
// packs, events, assist), RPG Battle, Story Director and NPC State Delta's v2 adapter definition,
// registered together as the integration tests do. Seeded crypto so runs replay.
const ROOT = process.env.BREAK_ROOT ?? '/home/user/cell/a2';

const { createHost } = await import(`${ROOT}/Story_block/testkit/index.js`);
const RB = await import(`${ROOT}/rpg_battle/src/v2/module.js`);
const SD = await import(`${ROOT}/Story_director/src/v2/module.js`);
const NSD = await import(`${ROOT}/npc_state_delta/src/storysuite-v2.js`);

/** mulberry32 */
export function prng(seed) {
    let a = seed >>> 0;
    const next = () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = (min, max) => min + Math.floor(next() * (max - min + 1));
    next.pick = list => list[Math.floor(next() * list.length)];
    next.chance = p => next() < p;
    return next;
}

export function seedCrypto(seed) {
    const crypto = globalThis.crypto;
    const random = prng(seed ^ 0x9E3779B9);
    const old = { values: crypto.getRandomValues, uuid: crypto.randomUUID };
    const hadV = Object.hasOwn(crypto, 'getRandomValues');
    const hadU = Object.hasOwn(crypto, 'randomUUID');
    crypto.getRandomValues = array => {
        const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(random() * 256);
        return array;
    };
    crypto.randomUUID = () => {
        const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16)).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
    };
    return () => {
        if (hadV) crypto.getRandomValues = old.values; else delete crypto.getRandomValues;
        if (hadU) crypto.randomUUID = old.uuid; else delete crypto.randomUUID;
    };
}

const fakeSuiteApi = { npcs: () => [{ name: 'Fenna', present: true }, { name: 'Brom', present: false }] };

export async function suiteHost({ nsd = true, options = {} } = {}) {
    let sdk = null;
    const rb = RB.createModule({ settings: () => sdk?.settings(RB.MODULE_ID) ?? {} });
    const sd = SD.createModule();
    const modules = [rb, sd];
    if (nsd) {
        const adapter = NSD.createStorySuiteV2Adapter({ suiteApi: fakeSuiteApi, delta: () => ({ isEnabled: () => true, getNpc: () => null }), doc: null, timers: {}, host: () => null, logger: { warn() {} } });
        modules.push(adapter.definition);
    }
    const host = await createHost({ ...options, modules });
    sdk = host.sdk;
    const saved = globalThis.StoryBlock;
    globalThis.StoryBlock = { apiVersion: 2, ready: Promise.resolve(sdk), sdk };
    const close = host.close;
    host.close = () => { close(); if (saved === undefined) delete globalThis.StoryBlock; else globalThis.StoryBlock = saved; };
    host.q = (name, args) => sdk.query(name, args);
    host.cmd = (type, payload = {}, opts) => sdk.command(type, payload, opts);
    host.reply = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);
    host.tails = () => host.st.promptLog.filter(e => e.key === 'story_suite_tail_1' && e.value).map(e => e.value);
    host.statics = () => host.st.promptLog.filter(e => e.key === 'story_suite_static' && e.value).map(e => e.value);
    return host;
}

/** A party so the story can go on (creation is mandatory, F12). */
export async function withParty(host) {
    const points = { STR: 3, VIT: 3, AGI: 2, DEX: 2, INT: 0, LUK: 0, CHA: 0 };
    let made = await host.cmd('party.create', { name: 'Ren', points });
    if (!made.ok) made = await host.cmd('creation.finish', { name: 'Ren', points });
    if (!made.ok) throw new Error(`party: ${made.code} ${made.message}`);
    return made;
}

export { RB, SD, NSD, createHost };
