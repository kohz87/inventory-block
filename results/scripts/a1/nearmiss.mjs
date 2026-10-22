const SB = '/home/user/cell/a1/Story_block';
const { createHost } = await import(`${SB}/testkit/index.js`);
console.warn = () => {};
const B = '\n\n<Changes>\n~ place Bluewatch Village\n</Changes>';
for (const l of ['+ Coin 5', '+coin 5', '+ coin: 5', '~ coin 5', '+  coin 5', '– coin 5', '− coin 5', '＋ coin 5', '+ coins 5', '+ present: Kael', '+ Present Kael', '**+ coin 5**', '`+ coin 5`', '+ coin', '+ coin five', 'coin + 5', '+ coin 5 | from: Fenna | from: Bo', '? choice', '~ chatter : hm', '~ chatter Fenna hm']) {
  const h = await createHost();
  h.features.set('story-block.choices', true); h.features.set('story-block.chatter', true);
  await h.send('Hi.', 'Road.');
  await h.send('Go.', `The hall.\n\n${l}${B}`);
  const c = h.sdk.query('inventory.wallet', { owner: 'party' }).coin ?? 0;
  const p = h.turn.problems().map(x => x.code).join(',');
  const kept = h.ctx.chat.at(-1).mes.split('<!--')[0].includes(l);
  console.log(JSON.stringify(l).padEnd(40), 'coin', c, 'problems', p || '-', kept ? 'shown' : 'hidden');
  h.close();
}
