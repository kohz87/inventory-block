// Re-read equality fuzz: each reply (with stray lines, display kinds, coins, xp, time) is captured live,
// then Re-read; the head must be the same (nothing edited, nothing toggled). Also a swipe + swipe back.
// usage: node reread-fuzz.mjs <from> <to> <replies>
import { appendFileSync } from 'node:fs';
const { suiteHost } = await import('/home/user/cell/a1/Story_block/tests/v2/break/helpers/suite.js');
import { createGen } from '/home/user/inventory-block/harness/break-scripts/gen.mjs';
console.warn = () => {}; console.error = () => {};
const [from = 1, to = 1, N = 60] = process.argv.slice(2).map(Number);
const OUT = '/home/user/cell/a1/out/scripts/rr.jsonl';
const J = v => JSON.stringify(v).replace(/"rc_[0-9a-z]{6,}"/g, '"rc"');
const COINS = [{ name: 'copper', value: 1 }, { name: 'silver', value: 10 }, { name: 'gold', value: 100 }];
let total = 0, diffs = 0;
for (let seed = from; seed <= to; seed++) {
  const h = await suiteHost({ seed, settings: { modules: { 'story-block': seed % 2 ? { coins: COINS, storyCoinPerReply: 60 } : {} } }, nsdNpcs: [{ name: 'Fenna' }] });
  h.features.set('story-block.choices', true); h.features.set('story-block.chatter', true);
  await h.cmd('party.create', { name: 'Wessel', preset: 'fighter' });
  const g = createGen(seed * 31);
  const { pick, int, chance } = g;
  const stray = () => pick(['+ coin 4', '+ coin 2 silver', '+ present Kael', '- present Kael', '+ xp minor — kept watch', '? choice Look ZQ', '~ chatter Fenna: hm', '! time +2h', '+ Coin 5', '+ coin: 3', '! encounter 2 Weir Rat — pack | tier: weak']);
  const sigs = [];
  for (let n = 0; n < N; n++) {
    const gg = g.next({ present: h.head()?.domains?.scene?.present ?? [], carried: [], wallet: 0, quests: [], companions: [] });
    let text = gg.reply;
    const at = text.indexOf('<Changes>');
    const s = Array.from({ length: int(1, 3) }, stray).join('\n');
    const mode = int(0, 4);
    if (mode === 0) text = at < 0 ? `${text}\n\n${s}` : `${text.slice(0, at).trimEnd()}\n\n${s}\n\n${text.slice(at)}`;
    else if (mode === 1) text = `${text}\n\n${s}`;
    else if (mode === 2) text = `${s}\n\nOne.\n\nTwo.\n\nThree.\n\nFour.\n\n${text}`;
    else if (mode === 3) text = at < 0 ? `${text}\n${s}` : `${text.slice(0, at).trimEnd()}\nShe nods.\n${s}\n\n${text.slice(at)}`;
    const stopped = chance(0.1);
    try {
      await h.send(gg.user, text, { stopped });
      total++;
      let didCont = false;
      if (chance(0.25)) didCont = true, await h.cont(pick([' More.', `\n\n${stray()}`, `\n\n<Changes>\n${stray()}\n</Changes>`, `\n\nLater.\n${stray()}`]));
      const live = J(h.head());
      const i = h.ctx.chat.length - 1;
      const r = await h.sdk.reread(i);
      const after = J(h.head());
      if (after !== live) {
        diffs++;
        let k = 0; while (k < live.length && live[k] === after[k]) k++;
        const known = stopped ? 'B-a1-3' : didCont ? 'B-a1-10?' : /--/.test(h.ctx.chat[i].mes) ? 'B-a1-11' : /<\/?Changes>[^\n]/i.test(text) || /[^\n]<\/?Changes>/i.test(text) ? 'B-a1-12?' : null;
        sigs.push({ n, known, stopped, ok: r?.ok, at: live.slice(Math.max(0, k - 120), k + 80), was: after.slice(Math.max(0, k - 120), k + 80), text: text.slice(-300) });
        // restore by rebuilding continues from the new state
      }
    } catch (e) { sigs.push({ n, threw: String(e?.stack ?? e).slice(0, 300) }); break; }
  }
  appendFileSync(OUT, J({ seed, sigs: sigs.slice(0, 5), nsigs: sigs.length }) + '\n');
  console.log(seed, 'diffs', sigs.length, 'unknown', sigs.filter(x => !x.known && !x.threw).length, sigs.slice(0, 2).map(x => (x.threw ?? `${x.stopped ? 'stopped ' : ''}${x.at.slice(-100)} || ${x.was.slice(-100)}`)).join(' ### '));
  h.close();
}
console.log('total replies', total, 'reread diffs', diffs);
