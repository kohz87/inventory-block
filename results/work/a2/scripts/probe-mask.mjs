import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
for (const text of [
  'Story with a <Changes> word in it.\n\n<think>\nI should pay 20.\n</think>\n\n<Changes>\n+ coin 5\n</Changes>',
  'The <Changes> tag.\n<think>\nplan: + coin 20\n</think>\n+ coin 5\n</Changes>',
  'Story.\n<Changes>\n+ coin 5\n<think>secret plan</think>\n+ item Rope\n</Changes>',
]) {
  const h = await suiteHost(); await withParty(h);
  await h.send('go', text);
  const coin = () => h.q('inventory.wallet', { owner: 'party' }).coin ?? 0;
  const live = coin();
  console.log('IN ', JSON.stringify(text)); console.log('OUT', JSON.stringify(h.ctx.chat.at(-1).mes)); 
  const rr = await h.sdk.reread(h.ctx.chat.length - 1);
  console.log('coin live', live, 'after reread', coin(), rr.ok, '| items', h.q('inventory.items').map(i=>i.name));
  const f = await suiteHost(); await f.st.loadChat(structuredClone(h.ctx.chat)); console.log('fresh replay coin', f.q('inventory.wallet', { owner: 'party' }).coin ?? 0); f.close(); h.close();
}
