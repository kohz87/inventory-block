// Reasoning: SillyTavern's extra.reasoning field, unclosed/odd think tags around a draft block.
import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
async function run(label, text, reasoning = null) {
  const h = await suiteHost();
  await withParty(h);
  if (reasoning !== null) { const orig = h.st.addMessage.bind(h.st); h.st.addMessage = m => { if (!m.is_user) m.extra = { ...(m.extra ?? {}), reasoning }; return orig(m); }; }
  await h.send('go', text);
  const inv = h.head().domains.inventory;
  const items = Object.values(inv.stacks).map(s => `${inv.defs[s.def]?.name}×${s.qty}`);
  console.log(label.padEnd(28), 'coin', inv.wallets.party?.coin ?? 0, items, '| npc', Object.keys(h.head().domains.npc.npcs), '| mes', JSON.stringify(h.ctx.chat.at(-1).mes.slice(0, 80)));
  // replay equals live
  const fresh = await suiteHost(); await fresh.st.loadChat(structuredClone(h.ctx.chat));
  if (JSON.stringify(fresh.head().domains) !== JSON.stringify(h.head().domains)) console.log('   REPLAY DIFFERS');
  fresh.close(); h.close();
}
const draft = '<Changes>\n+ coin 20\n+ item Thinkbait\n~ npc Fenna | trust: +5\n</Changes>';
const real = '<Changes>\n+ coin 7\n+ item Rope\n</Changes>';
await run('extra.reasoning', `Story.\n\n${real}`, `I will write\n${draft}`);
await run('think closed', `<think>${draft}</think>\nStory.\n\n${real}`);
await run('thinking/think mismatch', `<thinking>${draft}</think>\nStory.\n\n${real}`);
await run('think unclosed then real', `<think>\n${draft}\nStory.\n\n${real}`);
await run('think in code fence', '```\n<think>\n```\n' + `${draft}\n` + '```\n</think>\n```\n' + real);
await run('stray close first', `</think>\n${draft}\n<think>\nStory.\n\n${real}`);
await run('details reasoning', `<details><summary>Thinking</summary>\n${draft}\n</details>\nStory.\n\n${real}`);
await run('think w/ newline in tag', `<think\n>${draft}</think\n>\nStory.\n\n${real}`);
await run('thought tag', `<thought>${draft}</thought>\nStory.\n\n${real}`);
await run('reasoning attr', `<reasoning effort="high">${draft}</reasoning>\nStory.\n\n${real}`);
await run('think fullwidth', `＜think＞${draft}＜/think＞\nStory.\n\n${real}`);
await run('think after real', `Story.\n\n${real}\n<think>${draft}</think>`);
await run('cut mid-think', `<think>\nplanning\n${draft}`);
