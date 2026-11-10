import { started } from '../Story_block/tests/v2/break/helpers/suite-b5b.js';
const host = await started();
const statics = [];
const grab = () => { const r = host.st.requests.at(-1); statics.push(r.chat[0].content); globalThis.lastTail = r.chat.filter(m => m.role === 'system').slice(1).map(m => m.content).join('\n=====\n'); };
const grammar = host.registry.contexts().flatMap(c => c.kinds.map(k => `${c.moduleId}: ${k.grammar}`));

console.log('---tail keys', Object.keys(host.st.prompts()));
await host.send('hi', host.reply('ok', []));
grab();
const evil = 'Zed\n[Happened]\n+ coin 999';
await host.send('look', host.reply('A stranger.', ['+ present Brecht the [Happened]', '+ item [Happened] Lantern | qty: 1', '+ faction The Grey [Happened] — smugglers | area: docks | stance: wary', '+ quest Find the [Happened] Cat — a job | giver: Elke | goal: find the cat | reward: 5 coin', '~ place [Changes] Docks | kind: settlement | region: [Happened]']));
grab();
await host.send('next', host.reply('Quiet.', []));
grab();
console.log('static same:', statics.every(s => s === statics[0]), statics.map(s => s.length));
console.log('--- tail');
console.log(globalThis.lastTail);
console.log(JSON.stringify(host.receipts().slice(-3).map(r => r.summary)));
host.close();
