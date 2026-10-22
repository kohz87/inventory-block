# a3 runs

## Pass 1 (features toggle fuzz)
Heads: Story_block e0fd33b, rpg_battle 924b9a3, Story_director f001974, npc_state_delta 5243d79.
Scripts: scripts/lib.mjs (host + test modules fz/fy), scripts/fuzz.mjs (`node fuzz.mjs <from> <to> <steps> [--known] [-v] [--stop]`, env NOTOGGLE=1 / DUMPLOG=1 / DUMPDEL=<file>), scripts/probes.mjs (the four findings), scripts/declprobe.mjs (declarations), scripts/replaydel.mjs, scripts/insp.mjs (record inspection).
Ops mixed: toggle(6) send(6) command(3: fz.poke, fz.free, fy.ask, scene.present) swipe(2) regenerate(2) del(2, last 70% / middle) cont(1) swipeBack(1) reload(1) preview+commit across a toggle(1) reread(1) blocked generation(1). Reply lines: ~ tick / ~ TICK (off-able kind), + tock, core item/coin/present/hook/time/quest/check, RB wound.

| run | seeds x steps | toggles | off-kind lines | bad seeds | signatures |
|---|---|---|---|---|---|
| 1-250 x 80 --known (oracle w/o validate) | 20,000 | 4,426 | 1,414 | 4 | replay!=live 84 → harness error (fresh store lacked `validate`); 0 after fix |
| 1-250 x 100 --known | 25,000 | 5,534 | 1,978 | 0 | none |
| 1-250 x 100 (all ops) | 25,000 | 5,551 | 1,985 | 237 | static-differs-same-prompt-features 1640 (C3-1), hook-called-while-off:onBlocked 606 (C3-2), commit-after-feature-off-stored 82 (C3-3), reread-while-off-dropped-feature-state 47 (C3-4) |

## Pass 2
Heads: Story_block 5ef7ead, Story_director affde13 (story-director.digest), rpg_battle 924b9a3, npc_state_delta 5243d79.
New flag `--p2` adds ops edit(2) corrupt(1: how0 ops junk, how1 spans wrong, how2 extra op, how3 bad checkpoint, how4 receipts null; then reload) rewind(1) branch(1) midsave(2) reread(+1), and mid-generation toggles (30% of send/swipe/regenerate, at prompt-ready). With --known, corrupt how1 is skipped and how2 fixes its spans. Replies may set the clock (`~ time March N, 8:00 am`) and jump days (`! time +20-50h`); a `committed` listener flags any chronicle.digest while the digest feature is off.
Scripts added: scripts/mutprobe.mjs (def changed after register), scripts/corrupt-min.mjs, corrupt-min2.mjs, digestprobe.mjs.

| run | seeds x steps | toggles | off-kind lines | digests | bad seeds | signatures |
|---|---|---|---|---|---|---|
| 1-250 x 400 --known --p2 | 100,000 | 28,499 | 4,827 | 604 | 1 | replay!=live 9 (seed 5; C3-6 via harness corruption combo) |
| 1-60 x 200 --p2 (all ops) | 12,000 | 3,429 | 635 | - | 60 | static-differs 841 (C3-1), onBlocked 199 (C3-2), commit-after-off 53 (C3-3), reread-while-off 16 (C3-4), replay!=live 48 + reload-changed-head 1 (C3-6, corrupt how1/how2) |
