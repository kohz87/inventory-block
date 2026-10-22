import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
for (const stopped of [false, true]) {
  const h = await suiteHost();
  await withParty(h);
  await h.send('go', '<think>\nThe party should find rope.\n<Changes>\n+ coin 20\n+ item Torch | qty: 3\n</Changes>\nHmm, maybe not', { stopped });
  const mid = JSON.stringify(h.head().domains.inventory.wallets);
  await h.cont('.\n</think>\nYou find a rope.\n\n<Changes>\n+ item Rope\n</Changes>');
  const inv = h.head().domains.inventory;
  console.log('stopped', stopped, 'after cut', mid, '| after Continue coin', inv.wallets.party?.coin ?? 0, Object.values(inv.stacks).map(s => `${inv.defs[s.def]?.name}×${s.qty}`));
  console.log('   mes', JSON.stringify(h.ctx.chat.at(-1).mes));
  const fresh = await suiteHost(); await fresh.st.loadChat(structuredClone(h.ctx.chat));
  const f = fresh.head().domains.inventory;
  console.log('   fresh replay coin', f.wallets.party?.coin ?? 0, Object.values(f.stacks).map(s => `${f.defs[s.def]?.name}×${s.qty}`));
  fresh.close(); h.close();
}
