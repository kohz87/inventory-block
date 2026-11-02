# Review Y (2 Nov): SB 2.16.1 / SD 2.9.1 / NSD 1.7.1

Heads reviewed: Story Block `stage37/recover-heal` 84bb6b6, Story Director `stage37/world-now` de0db2b, NPC State Delta
`stage37/release` ea0c780 (a429a69 + 040f775). Fresh clones in `$S/rv-y/`. No commits or pushes. secrets.json was never opened.
The ST and the mock ran on ports 8204 and 8205, both stopped through their PID files.

## Verdict: BLOCK (1 blocker)

The fixes work for the case they target. With the fix, variants b, bn and c finish their change forward, with the same lineage and no new
index file. A slow load, or a chat switch during the load, never ends in a NOT_FOUND abort. ZC's wedged chat heals once when it opens.

The blocker: a healed chat wedges again for good when the reader edits back past the lost point, and the reader has no way out.
This affects only chats that were already wedged before the fix (pre-fix data). It is not a regression against the mains, because those
chats are wedged on the mains anyway. Still, it is an ordinary-use path that wedges, so it meets the blocker bar. The lead may decide to
ship with it as a known limit.

## Blocker 1: a healed chat wedges again on a swipe, a middle delete or a branch back past the lost point

**Repro.** Copy `$S/zc/st-data` and run with the three heads. Open `Ersveil - 2026-11-02@03h17m07s021ms`. It heals: one toast, one
Problems line, and `nm_q4zezu6y` is aborted. Then do any one of these:

- (a) `/del 1` (the unanswered message), then swipe right on the last reply (the reply the lost change stood on).
- (b) `/cut 10` (a middle reply).
- (c) Branch at an earlier reply (`/branch-create 16`). A Save point is a branch, and "Return here" opens it.

**Result.** Every time, the timeline stays `pending`, `head` answers RESTORE_PENDING, and a journaled `hs_…` selection stays `prepared`.
The game view says "The selected story is waiting for its records. If this continues, restore a save point from before the change, or
put the changed reply back." A send posts the message, then gets "Generation aborted by extension interceptors" and no reply.

**Cause (traced).** Before the fix, the wedge overwrote NSD's lineage. The selected head now needs a checkpoint from before that point,
and NSD refuses it on every recovery: `prepare` → `CONFLICT "The native checkpoint nk_5o2a8yp8 belongs to another story line."`
(nk_nx270e7y after the /cut, nk_pr9fho0r in the branch). The source is `participant.js verified()`: `doc.lineage !== session.lineage`.

**Way out: none found.**
- Swiping back: still held.
- Reloading and reopening: still held, because the journaled selection is finished as it was recorded.
- `/del 1`: still held.
- `/trigger`: still held.
- Save points: the screen says "No save points in this chat yet".
- A branch at an earlier reply: the branch itself is held, for the same reason.

The only escape is a new chat. In case (c) the original chat stays usable.

**Not affected.** Swiping a reply made after the heal works (selection goes to post-heal checkpoints). The control was the same
`/cut 10` on a healthy chat (03h33m), which finished its selection and replied.

**Suggested direction.** Fix this in NSD. Let a chat's story line accept its former lineage: the archive's selected checkpoint doc
carries L1, so hydrate or the heal can record it, and `verified()` can then accept it. A host-side "let go" for a selection is riskier,
because the participant would no longer follow the story.

Logs are in `$S/rv-y/run/`: heal-swipe-trace.log, heal-middelete.log, heal-branch.log, control-middelete.log. Shots:
`$S/rv-y/shots/heal-*.png`.

## Item checks

1. **Checks and tests.** All run on Node 24.22.1, with NSD's own `npm test`.

   | Repo | Tests | Pass | Fail | Skip / todo | Check | diff --check |
   |---|---|---|---|---|---|---|
   | SB | 4460 | 4449 | 0 | 10 skip, 1 todo | ok | clean |
   | SD | 1131 | 1129 | 0 | 2 skip | ok | clean |
   | NSD | 1617 | 1617 | 0 | 0 | validate ok | clean |

   For NSD, the compatibility check and the runtime smoke also passed, and `measure-stage9` exited 0 (prompt bytes match the baseline).

2. **The heal cannot drop a change that could still finish.**
   - By code: NOT_FOUND comes only from NSD itself, and only when its state is loaded and that lineage's index lacks the prepared id.
     An unregistered participant gives SNAPSHOT_UNAVAILABLE. A timeout gives FAILED. An unloaded state throws, which gives FAILED. A
     chat switch makes hydrate return null, which gives FAILED. None of these is aborted.
   - Real ST, variant b with NSD's sidecar held:
     - 3 s: finished forward.
     - 14 s: the first recovery failed on the 10 s participant timeout (FAILED, held). A second recovery about 22 s later ran by itself
       and finished forward.
     - Lineage `lg_e33axbor` was unchanged and stayed at 14 index files. No NATIVE_ABORTED in either run.
   - A native event is untouched: the unit test covers it, and nothing else changes that path.
   - The heal runs once. The entry stays `aborted`, and later recoveries do not call it again. Each heal showed one toast and one
     Problems line.

3. **hydrate-fix.** Nothing was minted or written while the state was unloaded.
   - Chat switch during an 8 s held load: the stale answer was dropped. The other chat was idle. Back in the first chat, the change
     finished forward. Every sidecar lineage was unchanged.
   - The retry path terminates (see the 14 s run).
   - NSD off: a new chat replied twice, made a save point and showed World.
   - In a chat that uses the timeline, with NSD off: a reply, a swipe and `/cut` all worked.
   - Prompt bytes: the unit measure is green. The real-ST comparison against the mains is **not done**: that step was denied (see below).

4. **Healed chat.** See Blocker 1.

5. **Real ST.**
   - BT variants b, bn and c are clean (table above). 
   - Five-reply play (6 replies with the long-place turn), desktop and phone, with Temiwa pinned: every reply arrived, the timeline was
     idle after each, 9 and 10 native mutations were done, with 0 toasts and 0 console errors.
   - World → Now matches the mockup.
     - People here shows portrait, name, standing chip (radius 999px) and the description, clamped to 1 line on desktop and 2 on phone.
       It has no Look, Next or hidden-note text. A click on the row edge and Enter on the card both open the dossier, and the dossier
       keeps Next and the hidden notes.
     - Around here cuts the long place with "…", with the full place as the `title`, and drops the day first. It does not overlap Key
       people at 1440 or 390.
     - The Pin list stays inside the card. A long list (18 rows, cloned in the page) scrolls inside it, and the wheel does not move the
       page. Opening it moves only the game-view scroller, never the window or the visual viewport.
   - Shots: `$S/rv-y/shots/world/`.

## Follow-ups (ranked)

1. **Phone Pin list.** `revealIn(..., 'nearest')` puts the opened card at the scroller bottom, so the floating bottom screen bar covers
   the card's note and part of the last row (`pin-many-p-short.png`, `pin-long-p.png`). The mockup shows the card top under the header.
2. **NSD off.** In a timeline chat, after `/cut`, `savepoint.make` answered STALE ("NPC State Delta has a change the story has not
   recorded yet") until Delta was switched on again. It is probably older than this release, but I could not compare it on the mains
   (denied step).
3. **The heal trusts an empty index.** By code: if NSD's index file reads as unparseable JSON, `vault.read()` returns null and the index
   is empty. Activate then answers NOT_FOUND and the change is aborted, even though its bytes exist. Rare.
4. **The heal toast could repeat.** By code: if `release()` fails after the heal, recover returns before `durable()`, so the `aborted`
   patch may not be saved and the toast could come again on the next open. Not observed.
5. **Around here on desktop.** The 282 px card cuts even "Bluewatch Village / Guild Office", and the day is always dropped at 1440. This
   follows the USER decision; I note it only because the heading rarely shows the time of day there.

## Denied step

The real-ST comparison against the released mains (prompt bytes in ordinary play, and NSD off on the mains) was denied. The safety
check stopped my edit of `$S/rv-y/tools/reset.sh`, which contains `rm -rf "$E/$r"`. I did not re-run it in any form. The edit was meant
to add a switch that keeps ZC's own extensions, which are the mains.

## Counts and files

Real-ST runs: 3 variants, 2 slow-load runs, 2 chat-switch runs, 1 NSD-off run, 7 healed-chat runs (including the control), 2 plays and
2 Pin-list runs.

- Tools: `$S/rv-y/tools/` (copies of BT's scripts, retargeted to ports 8204/8205, plus heal-edit, variant3, chatswitch, nsdoff,
  play-world, pinlist and pinlong).
- Logs: `$S/rv-y/run/` and `$S/rv-y/logs/`.
- Shots: `$S/rv-y/shots/`.
