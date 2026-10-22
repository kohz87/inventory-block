const R = (text, lines = []) => (lines.length ? `${text}\n\n<Changes>\n${lines.join('\n')}\n</Changes>` : text);
const FORBID = '\\b(fights?|fighting|combat|HP|XP|battles?|encounters?|foes?|enem(y|ies)|damage|attacks?|level(s|ed)?|beaten|wounds?)\\b';
export const CONFIGS = {
  s2: {
    exts: ['Story_block', 'Story_director'], char: 'Mira', forbid: FORBID, promptForbid: FORBID, walkFresh: true,
    replies: [
      ['Hi Mira. Thanks for the latte.', R('Mira leans on the counter. "Lantern Cafe, best foam in Saltmere." It is a slow Tuesday morning.', ['~ place Lantern Cafe | kind: cafe | region: Saltmere', '+ present Mira', '~ time Tuesday, 9:00', '+ item Latte | qty: 1'])],
      ['Would you like to see a film with me sometime?', R('Her eyes light up. "The Orpheum is showing Casablanca on Friday. Take me to two films this month and I\'ll cook you dinner."', ['+ quest Movie Nights — Mira wants to see old films together | giver: Mira | goal: Take Mira to 2 films | reward: a home-cooked dinner', '+ hook Mira\'s Sketchbook — she hides a sketchbook under the counter', '! time +30m'])],
      ['I challenge her to pinball after her shift.', R('"You are on." At the arcade she wins the first game easily. "Best of three? Beat me three times and I pick the next date."', ['+ quest Pinball Rivalry — beat Mira at pinball | giver: Mira | goal: Beat Mira 3 times at pinball | reward: you pick the next date', '~ place Neon Arcade | kind: arcade', '! time +8h', '+ agenda Mira — closing the cafe | now: Lantern Cafe | then: meets {{user}} at the arcade | on: Tuesday, 17:00'])],
      ['We go to the Orpheum on Friday.', R('Casablanca flickers; Mira steals your popcorn and cries at the end.', ['~ quest Movie Nights | progress: 1 of 2 films', '~ time Friday, 20:00', '~ place The Orpheum | kind: cinema', '+ beat First Kiss — a quiet moment under the cinema awning | on: Friday, 23:00 | reach: they become a couple'])],
      ['I walk her home.', 'The night is warm. She hums the film\'s song all the way to her door.'],
      ['Next week, the second film.', R('Roman Holiday. She holds your hand through all of it.', ['~ quest Movie Nights | progress: 2 of 2 films | met: yes', '! time +7d', '+ clock Summer Festival — the festival ends and the beach closes | due: Sunday, 22:00 | shown: sign'])],
      ['I tell Mira I kept my promise.', R('She laughs and pulls you into the kitchen. Dinner is pasta and too much garlic.', ['- quest Movie Nights — turned in', '+ item Mira\'s Recipe Card | qty: 1'])],
    ],
    swipeReply: R('She makes risotto instead.', ['- quest Movie Nights — turned in', '+ item Spare Key | qty: 1']),
    after: R('Morning light on the harbour.', ['! time +10h']),
  },
};

// RPG Battle: make the character through the wizard (the held-send path first)
export async function wizard(p, D, log) {
  const s = await D.send(p, 'I step onto the quay.', 'This reply must never be used.', 6000);
  const blocked = await p.ev(() => ({ notice: document.querySelector('#story_suite_v2_bar .story-suite-notice-text')?.textContent ?? null, dialog: document.querySelector('.ss-dialog-title')?.textContent ?? null }));
  D.clearQueue();
  const steps = [];
  await p.ev(() => document.querySelector('.ss-dialog .rpg-preset-go')?.click()); await D.sleep(600);
  for (let i = 0; i < 12; i++) {
    const st = await p.ev(() => ({ next: !!document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])'), body: document.querySelector('.ss-dialog-body')?.innerText?.replace(/\s+/g, ' ').slice(0, 80) }));
    steps.push(st.body);
    if (!st.next) break;
    await p.ev(() => document.querySelector('.ss-dialog-next:not([hidden]):not([disabled])').click()); await D.sleep(500);
  }
  const created = await p.ev(async () => { const b = document.querySelector('.ss-dialog-submit:not([hidden])') ?? document.querySelector('.ss-dialog .cc-go'); b?.click(); await new Promise(r => setTimeout(r, 2500)); return { clicked: !!b, error: document.querySelector('.ss-dialog-error')?.textContent ?? null }; });
  let pc = await p.ev(() => { try { return StoryBlock.sdk.query('party.pc'); } catch (e) { return 'ERR ' + e.message; } });
  if (!pc || typeof pc !== 'object') {
    log(`wizard did not create: ${JSON.stringify(created)} steps=${JSON.stringify(steps)}`);
    await p.shot(`${D.OUT}/shots/wizard-fail.jpg`, 40);
    pc = await p.ev(async () => { const c = StoryBlock.sdk.query('creation.content'); const pr = c.presets?.[0]; const pts = { STR: 2, VIT: 2, AGI: 2, DEX: 2, INT: 1, LUK: 1, CHA: 0 }; const r = await StoryBlock.sdk.command('creation.finish', pr ? { name: 'Ren', preset: pr.id, race: pr.race, talents: pr.talents, points: pr.points } : { name: 'Ren', race: c.races?.[0]?.id, talents: [], points: pts }); await new Promise(r => setTimeout(r, 1500)); document.querySelector('.ss-dialog .ss-dialog-close')?.click(); return r.ok ? StoryBlock.sdk.query('party.pc') : `${r.code} ${r.message}`; });
  }
  await p.ev(async () => { const c = SillyTavern.getContext(); if (c.chat.at(-1)?.is_user) await c.deleteLastMessage(); await c.saveChat(); });
  return { held: !s.ok || s.reqs.length === 0, reqs: s.reqs.length, blocked, steps: steps.length, created, pc: pc?.name ?? pc };
}
export async function fight(p, D, log, tag) {
  const r = await p.ev(async () => {
    const W = ms => new Promise(r => setTimeout(r, ms));
    const pn = document.querySelector('#story_suite_v2_panel'); if (pn.hidden) document.querySelector('.story-suite-bar-story').click(); await W(500);
    const t = [...document.querySelectorAll('#story_suite_v2_panel .story-suite-tab')].find(x => /^Fight/.test(x.textContent.trim())); t?.click(); await W(900);
    const b = document.querySelector('#story_suite_v2_panel [data-command="combat.start"]'); b?.click(); await W(1500);
    let s = StoryBlock.sdk.query('combat.session'); let n = 0;
    while (s && s.status === 'active' && n < 80) { const a = [...document.querySelectorAll('.rpg-bb-act')].find(x => /auto/i.test(x.textContent) && !x.disabled); if (a) a.click(); else await StoryBlock.sdk.command('combat.act', { action: { type: 'auto' } }); n++; await W(350); s = StoryBlock.sdk.query('combat.session'); }
    const status = s?.status;
    const fin = document.querySelector('.rpg-bb-finish'); fin?.click(); await W(1500);
    return { tab: !!t, startBtn: !!b, acts: n, status, finished: !!fin, after: StoryBlock.sdk.query('combat.session'), last: String(StoryBlock.sdk.query('combat.last')?.summary ?? '').slice(0, 200) };
  }, undefined, 120000);
  return r;
}
CONFIGS.s3 = {
  exts: ['Story_block', 'rpg_battle'], char: 'The Narrator',
  before: (p, D, log) => wizard(p, D, log),
  replies: [
    ['I look around the quay.', R('The quay is slick with rain. A fishwife, Odda, sells trout.', ['~ place Bluewatch Quay | kind: dock', '+ present Odda', '+ item Healing Salve | qty: 1', '+ item Minor Healing Draught | qty: 1', '+ coin 30 | from: a dropped purse', '+ item <b>Bold</b> Mug <img src=x onerror="window.__xss=1"> | qty: 1'])],
    ['I head into the alley.', R('Two river rats as big as dogs come out of a drain.', ['! encounter 2 Giant Rat — out of the drain | tier: weak | stakes: normal'])],
    ['I climb the palisade.', R('You haul yourself up and tear a knuckle.', ['? check climb — the wet palisade | dc: normal | roll: 12 | result: success', '~ wound {{user}} — tore a knuckle | harm: wound'])],
    ['I use the healing salve.', R('The salve stings and soothes.', ['! use Healing Salve | on: {{user}}'])],
    ['I rest at the inn.', R('You sleep well.', ['! time +8h', '+ item <b>Bold</b> Mug <img src=x onerror="window.__xss=1"> | qty: 1'])],
  ],
  hooks: { 2: (p, D, log) => fight(p, D, log, 'h2') },
  swipeReply: R('You sleep badly.', ['! time +6h']),
};
CONFIGS.s4 = {
  exts: ['Story_block', 'npc_state_delta'], char: 'The Narrator', walkFresh: true,
  replies: [
    ['I greet Odda.', R('Odda the fishwife grins at you.', ['~ place Bluewatch Quay | kind: dock', '+ present Odda', '~ npc Odda | trust: +10 | affection: +5'])],
    ['I help her carry crates.', R('She thanks you warmly.', ['~ npc Odda | trust: +15', '+ milestone Crate Help — you carried her crates in the rain'])],
    ['I meet the harbourmaster.', R('Harbourmaster Brecht eyes you.', ['+ present Brecht', '~ npc Brecht | trust: -20 | affection: -5', '~ npc <b>Evil</b> <img src=x onerror="window.__xss=1"> | trust: +3'])],
    ['I bribe Brecht.', R('He pockets nothing and scowls.', ['~ npc Brecht | trust: +9999 | affection: banana'])],
    ['I talk to Odda again.', R('She smiles.', ['~ npc Odda | affection: +10', '+ milestone Crate Help — again'])],
  ],
  swipeReply: R('She frowns this time.', ['~ npc Odda | affection: -10']),
  end: async (p) => p.ev(() => { try { return { npcs: JSON.stringify(StoryBlock.sdk.view().state.domains).match(/"(Odda|Brecht|[^"]*Evil[^"]*)"/g)?.slice(0, 10) }; } catch (e) { return e.message; } }),
};
const featuresFn = async on => {
  const W = ms => new Promise(r => setTimeout(r, ms));
  const list = StoryBlock.sdk.features();
  const es = SillyTavern.getContext().extensionSettings; es.storySuite ??= {}; es.storySuite.features ??= {};
  for (const f of list) es.storySuite.features[f.id] = on;
  SillyTavern.getContext().saveSettingsDebounced();
  // also through the switches (so the runtime hears it)
  document.querySelector('.story-suite-bar-settings').click(); await W(1200);
  for (const d of document.querySelectorAll('#story_suite_v2_overlay details')) d.open = true; await W(400);
  let flipped = 0;
  for (const row of document.querySelectorAll('.story-suite-feature')) { const i = row.querySelector('input'); if (i && !i.disabled && i.checked !== on) { i.checked = on; i.dispatchEvent(new Event('change', { bubbles: true })); flipped++; await W(150); } }
  [...document.querySelectorAll('#story_suite_v2_overlay button')].find(b => /close/i.test(b.textContent))?.click(); await W(500);
  return { total: list.length, flipped, now: StoryBlock.sdk.features().filter(f => f.on !== on).map(f => f.id) };
};
const ALL4 = ['Story_block', 'rpg_battle', 'Story_director', 'npc_state_delta'];
const all4Replies = [
  ['I look around the quay.', R('Rain on the quay. Odda sells trout.', ['~ place Bluewatch Quay | kind: dock', '+ present Odda', '~ time Day 1, 08:00', '+ item Healing Salve | qty: 2', '+ coin 30 | from: a purse', '~ npc Odda | trust: +10', '? loot Rusty Key, Torn Map — in a crate'])],
  ['I take Odda\'s job: clear the rats.', R('"Rats in the cellar," Odda says. Two rats come out.', ['+ quest Cellar Rats — Odda wants the cellar cleared | giver: Odda | goal: Kill 2 Giant Rat | reward: 20 gold', '! encounter 2 Giant Rat — out of the drain | tier: weak | stakes: normal', '! time +20m'])],
  ['I climb out.', R('You climb out and tear a knuckle.', ['? check climb — the wet ladder | dc: normal | roll: 9 | result: success', '+ milestone First Job — you helped Odda', '+ world Hill Rain — rain coming down | state: looming'])],
  ['I tell Odda.', R('Odda pays you.', ['- quest Cellar Rats — turned in to Odda', '~ npc Odda | affection: +5', '! use Healing Salve | on: Ren'])],
  ['I rest.', R('You sleep.', ['! time +8h', '+ item Wool Cloak | qty: 1'])],
];
CONFIGS.s5off = { exts: ALL4, char: 'The Narrator', features: false, featuresFn, before: (p, D, log) => wizard(p, D, log), replies: all4Replies, hooks: { 2: (p, D, log) => fight(p, D, log, 'h2') }, swipeReply: R('You sleep badly.', ['! time +6h']) };
CONFIGS.s5on = { ...CONFIGS.s5off, features: true };
