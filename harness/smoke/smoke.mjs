// Smoke: index.js with fake SillyTavern and Story Block.
const repo = process.argv[2];
const { installFakeDom } = await import(`${repo}/tests/ui-fake-dom.js`);
const doc = installFakeDom();
globalThis.document = doc;
const host = doc.createElement('div'); host.id = 'extensions_settings'; doc.body.appendChild(host);
const prompts = [];
const ctx = {
    extensionSettings: {}, chat: [{ is_user: false, mes: 'x' }], chatMetadata: {},
    getCurrentChatId: () => 'c1', saveSettingsDebounced() {}, eventTypes: {}, eventSource: { on() {} },
    setExtensionPrompt: (...args) => prompts.push(args), substituteParams: t => t,
};
globalThis.SillyTavern = { getContext: () => ctx };
globalThis.StoryBlock = { apiVersion: 1, registerBlock: () => ({ ok: true }), registerTab() {}, onReply() {}, listBlocks: () => [], blockInText: () => null, blockForGeneration: () => null, refresh() {} };
await import(`${repo}/index.js`);
await new Promise(r => setTimeout(r, 50));
const suite = globalThis.StorySuite;
console.log('providers', JSON.stringify(suite.providers().map(p => [p.id, p.owns, p.enabled, p.api === globalThis.StoryDirector])));
console.log('calendar', JSON.stringify(globalThis.StoryDirector.calendar()).slice(0, 80));
await globalThis.storyDirectorInterceptor([], 0, null, 'normal');
console.log('alone note has line:', String(prompts.at(-1)[1]).includes('NPC State Delta'));
suite.announce({ id: 'npc-state-delta', name: 'NPC State Delta', version: '1', owns: ['npc', 'calendar'] });
console.log('note text:', doc.body.querySelector('.story-director-suite-note')?.textContent);
await globalThis.storyDirectorInterceptor([], 0, null, 'normal');
console.log('with NSD note has line:', String(prompts.at(-1)[1]).includes('NPC State Delta keeps'));
// switch off via the settings panel
const sw = doc.body.querySelector('#story_director_enabled'); sw.checked = false; sw.dispatch('change');
console.log('after off', JSON.stringify(suite.providers().map(p => p.id)));
sw.checked = true; sw.dispatch('change');
const sel = doc.body.querySelector('#story_director_source_calendar'); sel.value = 'theirs'; sel.dispatch('change');
console.log('after theirs', JSON.stringify(suite.providers().map(p => [p.id, p.owns])), suite.owner('calendar'));
console.log('saved', JSON.stringify(ctx.extensionSettings.storyDirector.sourceOfTruth));
let n = 0; suite.onChange(() => n++); suite.announce({ id: 'rpg-battle', name: 'RPG Battle', owns: ['stats'] }); console.log('notifies', n);
process.exit(0);
