import { suiteHost, withParty } from './suite-host.mjs';
console.warn = () => {};
for (const text of [
  '<!-- STORY_SUITE_V2\n<Changes>\n+ coin 7 -->\n<Changes>\n- item Rope\n</Changes>\n+ item Rope',
  'Story.\n<Changes>\n+ coin 7\n</Changes>\n<Changes>\n- item Rope\n</Changes>\n+ item Rope',
  'Story <!-- note --> more.\n<Changes>\n+ item Rope\n</Changes>',
  '<!-- STORY_SUITE_V2 a fake -->\nStory.\n<Changes>\n+ item Rope\n+ coin 3\n</Changes>',
  'Story.\n<Changes>\n+ item Rope | note: <!-- STORY_SUITE_V2\n+ coin 3\n</Changes>\nmore -->',
]) {
  const h = await suiteHost(); await withParty(h);
  await h.send('go', text);
  const k = () => JSON.stringify([h.q('inventory.wallet', { owner: 'party' }).coin ?? 0, h.q('inventory.items').map(i => `${i.name}×${i.qty}`)]);
  const live = k(); const mes = h.ctx.chat.at(-1).mes;
  const rr = await h.sdk.reread(h.ctx.chat.length - 1);
  const f = await suiteHost(); await f.st.loadChat(structuredClone(h.ctx.chat));
  console.log(JSON.stringify(text).slice(0, 90), '\n  live', live, 'reread', rr.ok, k(), '\n  mes', JSON.stringify(mes));
  f.close(); h.close();
}
