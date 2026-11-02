# ZP — portraits made easy (USER, 2 Nov: "do both now"). Rules: X-COMMON.md hard rules (exact trailer, push only your
# branch, never merge/PR/force/tag, no version bump or CHANGELOG — the lead releases, a test per change run after it,
# check + full test + diff --check green, PID files, never pkill -f/pgrep -f, never playwright install, never touch
# rpg_battle, never open secrets.json). If any command is denied, stop that step and report it; never re-run it in
# another form. Fresh folders; never delete outside your own clone.

## ZP1 — Story Block (branch `stage38/ersveil-zip` from origin/main e0d5b97; clone $S/zp1/; ST port 8208)
1. Ship `examples/packs/ersveil.zip`: pack.json + the 12 portraits under the folder layout Story Block's zip import
   expects (the same layout Story Studio exports — read SB's zip reader and Studio's exporter). Build it with a small
   deterministic script in the repo (fixed timestamps/order, so rebuilding gives identical bytes), e.g.
   `scripts/build-example-zip.mjs`, and a test that fails if the zip's pack.json or portraits differ from the files in
   examples/packs/ersveil/ (so the zip can never drift), and that SB's own `readPackZip` accepts it.
2. README (and AI-README, docs/v2/ERSVEIL.md where it says how to import): the one-step way is the .zip; picking
   pack.json alone imports no pictures. Keep it short.
3. Real ST: import the zip in a fresh data copy → "12 portraits saved", meet one cast person, portrait shows.
Report: head, zip size, test, what the README now says.

## ZP2 — NPC State Delta (branch `stage38/portrait-backfill` from origin/main 19c1ea9; clone $S/zp2/; ST port 8209)
A dossier made from a pack's cast while its picture was missing (pack imported without pictures) never gets the
portrait later: castSync (index.js) reads `packs.portrait` only when it creates the dossier. Fix: when a dossier made
from the cast (`castFrom`) has no portrait of its own and Story Block's `packs.portrait` now answers for its entry's
`portrait`, save it the same way castSync does (castPortraitRecord → content-addressed file) and set it on that
dossier. Rules:
- never replace a portrait the reader set, generated or removed on purpose (find how a removal is recorded and respect
  it); only fill an empty one, only for cast-made dossiers;
- it is an ordinary dossier change: same freshness/mutation boundary as castSync, checkpointed so swipe / delete /
  restore stay exact; runs when it can (chat open, after a pack import or on the next reply), once per person;
- no prompt or saved-state change for anyone else; a missing file still shows the placeholder.
Tests (unit + hosted rig): fills an empty cast dossier; leaves a reader-set or removed portrait alone; leaves non-cast
dossiers alone; once only; swipe/restore exact. Full NSD suite under Node 24 + validate + compat + smoke + diff --check.
Real ST: import Ersveil pack.json WITHOUT pictures, meet a cast person (no portrait), then import the pictures (or the
zip from ZP1's branch if pushed) → the portrait appears without a new chat; shots desktop + phone into $S/zp2/shots/.
Report: head, what triggers the fill, tests, counts, shots.
