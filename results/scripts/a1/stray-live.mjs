const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
console.warn = () => {};
const coin = h => h.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;
async function run(name, reply, opts = {}) {
  const h = await createHost({ settings: { modules: { 'story-block': opts.sb ?? {} } } });
  await h.send('Hello.', 'The road.');
  await h.send('Go on.', reply, { stopped: opts.stopped === true });
  const live = coin(h); const pres = JSON.stringify(h.head().domains.scene?.present ?? null);
  const shown = h.ctx.chat.at(-1).mes;
  const probs = (h.sdk.problems?.() ?? []).map(p => p.code).join(',');
  let rr = null;
  if (opts.reread) { const res = await h.sdk.reread(h.ctx.chat.length - 1); rr = { ok: res?.ok, coin: coin(h), present: JSON.stringify(h.head().domains.scene?.present ?? null) }; }
  console.log(name, { live, pres, probs, rr, shown: JSON.stringify(shown).slice(0, 220) });
  h.close();
}
await run('dialogue+', 'Fenna laughed at him.\n\n+ coin 5, she said, and not one more.');
await run('dialogue+ block', 'Fenna laughed at him.\n\n+ coin 50, she said, and not one more.\n\n<Changes>\n~ place Bluewatch Village\n</Changes>');
await run('fence', 'He showed the ledger format:\n\n```\n+ coin 40\n```\n\n<Changes>\n~ place Bluewatch Village\n</Changes>');
await run('blockquote', 'The note read:\n\n> + coin 40\n\n<Changes>\n~ place Bluewatch Village\n</Changes>');
await run('stopped', 'Fenna arrives.\n\n+ present Fenna', { stopped: true, reread: true });
await run('stopped coin', 'A purse.\n\n+ coin 12', { stopped: true, reread: true });
