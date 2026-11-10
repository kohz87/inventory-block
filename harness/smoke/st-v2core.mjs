import { open, S } from './demo-common.mjs';
const h = await open({ width: 1280, height: 900 });
const { page, ev } = h;
await h.openNarrator('The Narrator - v2core');
const base = '/scripts/extensions/third-party/Story_block/src/v2';
const out = await ev(async base => {
  const log = [];
  const { createStore } = await import(`${base}/store.js`);
  const { createCommandBus } = await import(`${base}/commands.js`);
  const ctx = SillyTavern.getContext();
  // A test module owning one domain, with a minimal registry (registry.js is still being built).
  const mod = { id: 'v2-smoke', domains: { tally: { initial: () => ({ n: 0, items: {} }), validate: s => (s.n < 0 ? ['n below 0'] : []) } },
    commands: {
      'tally.add'(c, p) { const d = c.draft('tally'); d.n += p.by; const r = Math.floor(c.rng() * 6) + 1; return { summary: `added ${p.by}, rolled ${r}`, data: { roll: r } }; },
      'tally.sub'(c, p) { const d = c.draft('tally'); d.n -= p.by; return { summary: `sub ${p.by}` }; },
    } };
  const registry = {
    modules: () => [mod], domainOwner: d => (d in mod.domains ? mod.id : null), commandOwner: t => (t in mod.commands ? mod.id : null),
    command: t => mod.commands[t], validator: d => mod.domains[d]?.validate, captureOwner: () => null, capture: () => null, hooks: () => [],
    initialState: () => ({ v: 2, meta: { rev: 0, claims: {} }, domains: { tally: mod.domains.tally.initial() } }),
  };
  const save = () => ctx.saveChat();
  let store = createStore({ chat: () => SillyTavern.getContext().chat, save });
  log.push(`carriers: head index ${store.headIndex()}, state ${JSON.stringify(store.head())}`);
  store.ensureInitial(registry.initialState());
  const bus = createCommandBus({ store, registry });
  const a = bus.command('tally.add', { by: 5 });
  const b = bus.command('tally.add', { by: 2 });
  const bad = bus.command('tally.sub', { by: 100 });
  log.push(`commands: ${a.ok}/${b.ok}/${bad.ok} ${bad.code} — ${a.receipt?.summary}; ${b.receipt?.summary}`);
  log.push(`head after: n=${store.head().domains.tally.n} rev=${store.head().meta.rev}`);
  await store.flush();
  // Reload the chat from disk and rebuild.
  await ctx.reloadCurrentChat(); await new Promise(r => setTimeout(r, 2000));
  store = createStore({ chat: () => SillyTavern.getContext().chat, save });
  log.push(`after reload: n=${store.head()?.domains.tally.n} rev=${store.head()?.meta.rev} untold=${store.untold().map(r => r.summary).join(' | ')}`);
  // A reply arrives (a new carrier), then an action after it, then the reply is deleted.
  const c2 = SillyTavern.getContext();
  c2.chat.push({ name: c2.name1, is_user: true, is_system: false, send_date: 'u1', mes: 'go', extra: {} });
  c2.chat.push({ name: 'The Narrator', is_user: false, is_system: false, send_date: 'r1', mes: 'A reply.', swipes: ['A reply.'], swipe_id: 0, swipe_info: [{ send_date: 'r1', extra: {} }], extra: {} });
  store.rebuild();
  const bus2 = createCommandBus({ store, registry });
  bus2.command('tally.add', { by: 10 });
  log.push(`after reply + action: n=${store.head().domains.tally.n}, carrier ${store.headIndex()}`);
  await store.flush();
  c2.chat.splice(c2.chat.length - 2, 2); await ctx.saveChat(); store.rebuild();
  log.push(`after deleting the reply: n=${store.head().domains.tally.n} (expect 7)`);
  const file = await (await fetch('/api/chats/get', { method: 'POST', headers: ctx.getRequestHeaders(), body: JSON.stringify({ ch_name: 'The Narrator', file_name: 'The Narrator - v2core', avatar_url: ctx.characters.find(c => c.name === 'The Narrator').avatar }) })).json();
  log.push(`on disk: greeting record ${JSON.stringify(file[1]?.extra?.storySuite ? { ops: file[1].extra.storySuite.ops.length, receipts: file[1].extra.storySuite.receipts.length, checkpoint: !!file[1].extra.storySuite.checkpoint } : null)}`);
  return log;
}, base);
console.log(out.join('\n'));
console.log('page errors:', h.errors.join('\n') || 'none');
await h.browser.close();
