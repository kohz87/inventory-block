import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const from = (dir, path) => pathToFileURL(resolve(dir, path)).href;
const { createHost } = await import(from(process.env.SB_DIR, 'testkit/index.js'));
const { createModule } = await import(from(process.env.SD_DIR, 'src/v2/module.js'));
const pack = JSON.parse(readFileSync(resolve(process.env.SB_DIR, 'examples/packs/ersveil/pack.json')));
const mod = 'pack.ersveil/succession';
const reply = (...lines) => `The story.\n<Changes>\n${lines.join('\n')}\n</Changes>`;
const row = (h, id) => h.sdk.query('events.status').events.find(e => e.id === `pack.ersveil/${id}`);
const chronicle = (h, name) => Object.values(h.head().domains.chronicle.events).find(e => e.name === name);
const month = async (h, n) => { for (let i = 0; i < n; i++) await h.send('A month passes.', reply('! time +30d')); };
const dm = (kind, who) => `${kind === 'back' ? '+' : '-'} dm ${mod} — our deeds ${kind} ${who} | kind: ${kind} | claimant: ${who} | size: great`;
async function start(pin = false) {
  let sdk = null;
  const sd = createModule({ host: { settings: id => sdk?.settings(id) ?? null, substitute: text => sdk?.substitute(text) } });
  const h = await createHost({ modules: [sd] }); sdk = h.sdk;
  assert.equal((await h.packs.packs.install(pack)).ok, true);
  await h.store.flush(); await h.st.loadChat([], `story-${Math.random()}`);
  await h.send('Begin.', reply());
  if (pin) {
    const o = sdk.query('dataModules.offers').find(x => x.module === mod);
    assert.equal((await sdk.command('dm.pin', { module: mod, hash: o.hash, packHash: o.packHash, subjects: [] })).ok, true);
  }
  return h;
}
const fired = (h, prefix) => h.sdk.query('events.status').events.filter(e => e.id.startsWith(`pack.ersveil/${prefix}`) && !/scene|news/.test(e.id) && e.status === 'fired').map(e => e.id.split('/')[1]);
{ // B1 + B2 battle
  const h = await start(true);
  try {
    const v = h.sdk.query('dataModules.view', { module: mod }).chat;
    assert.deepEqual([v.wendhild, v.corvin, v.hasse, v.least], [40, 35, 25, 'hasse']);
    await month(h, 25); await h.send('Eight days and two hours.', reply('! time +8d 2h'));
    await h.send('Undermine Corvin.', reply(dm('undermine', 'corvin')));
    await h.send('Undermine Corvin again.', reply(dm('undermine', 'corvin')));
    await h.send('Again.', reply(dm('undermine', 'corvin')));
    await h.send('Continue.', reply());
    assert.deepEqual(fired(h, 'marrowbridge-'), ['marrowbridge-hasse']);
    console.log('B1/B2 battle ok', h.sdk.query('dataModules.view', { module: mod }).chat);
  } finally { h.close(); }
}
{ // B2 crown
  const h = await start(true);
  try {
    await month(h, 33); await h.send('Continue.', reply());
    assert.deepEqual(fired(h, 'crown-'), ['crown-wendhild-over-corvin']);
    for (let i = 0; i < 3; i++) await h.send('Support Corvin.', reply(dm('back', 'corvin')));
    await h.send('Continue.', reply()); await h.send('Continue.', reply());
    assert.deepEqual(fired(h, 'crown-'), ['crown-wendhild-over-corvin']);
    console.log('B2 crown ok');
  } finally { h.close(); }
}
{ // B3 pruning: the Wall still holds
  const h = await start();
  try {
    await month(h, 33); await h.send('Continue.', reply());
    for (let i = 1; i <= 32; i++) await h.send('The wider world moves.', reply(`+ world Regional crisis ${i} — the crisis ends | state: resolved`, '! time +15d'));
    await month(h, 5); await h.send('Continue.', reply()); await h.send('Continue.', reply());
    assert.equal(row(h, 'last-wall-wendhild').status, 'fired');
    assert.ok(chronicle(h, 'The Tide held at the Last Wall'));
    console.log('B3 wall ok', h.sdk.query('time.now').text);
  } finally { h.close(); }
}
{ // B3 Auvoth once
  const h = await start(true);
  try {
    for (let i = 0; i < 4; i++) await h.send('Oppose Wendhild.', reply(dm('undermine', 'wendhild')));
    for (let i = 0; i < 2; i++) await h.send('Support Corvin.', reply(dm('back', 'corvin')));
    await month(h, 39); await h.send('Continue.', reply());
    assert.equal(row(h, 'auvoth-falls-early').status, 'fired');
    for (let i = 1; i <= 32; i++) await h.send('The wider world moves.', reply(`+ world Regional crisis ${i} — the crisis ends | state: resolved`, '! time +15d'));
    await h.send('Continue.', reply());
    assert.notEqual(row(h, 'auvoth-falls').status, 'fired');
    console.log('B3 Auvoth ok', h.sdk.query('time.now').text);
  } finally { h.close(); }
}
{ // B4
  const h = await start();
  try {
    await month(h, 1); await h.send('Two hours.', reply('! time +2h'));
    await h.send('Shelter for five days.', reply('! time +5d'));
    await h.send('Continue.', reply());
    assert.equal(row(h, 'flood-611').status, 'fired');
    assert.equal(row(h, 'flood-611-scene').status, 'fired');
    console.log('B4 ok');
  } finally { h.close(); }
}
