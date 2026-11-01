# FB — bars, foe Health and the Fight tab for the Standard formula

Read F-COMMON.md first. Branch `stage31/fb` from `origin/stage31/formula-base`. Test ST port 8177.
You own: templates.js (block definitions), read.js, tail.js, lean-rpg/view/* (Party card, Fight tab, hero-data,
battle-log rendering of the order/quick-start lines), your strings, docs/v2/RPG.md (bars/Fight sections). FA owns the
roll engine (rules/resolve/plan/precall/cue/join/start/names, Settings → RPG, creation Stats step): do not edit them.

1. Character block for Standard chats: Health 0..8, Stamina 0..7, Mana 0..7 (stored values = blocks left; the bar's size
   is formula.blocksFor(stats) at read time). New template versions for Standard; Classic templates and their data-module
   hashes unchanged. Stage words spread over the bar's size (Unhurt … Down; Fresh … Empty), and the narrator still reads
   words, never numbers. A new block from spending points arrives full except while Down; a lower stat clamps the
   current value and never knocks Down (code, with tests on rebuild == live == reload).
2. Foes block for Standard: a group's Health 0..8 with size foeHealthBlocks(class); words spread the same way.
3. Views (mockup steps 1–2): Party card bars with N blocks and "word · n of N", the "next block / next luck" line under the
   skills; hero bars (hero-data.js) with the same sizes; Fight tab: the turn order row (rolled at the start of the fight,
   read from what FA records — agree the shape with FA through the payload: `order: [{ id, name, total, party }]`,
   `quickStart: [{ who, against }]`; if FA's branch is not there yet, read it defensively and render nothing without it),
   foe cards with Health by class. Battle log: render FA's breakdown lines, the "does not act" line and quick-start line.
4. Tail/prompt: the narrator's lines for bars stay words; Classic output byte-identical.
5. Tests for each item; shots of mockup steps 1–2 on desktop and phone.
