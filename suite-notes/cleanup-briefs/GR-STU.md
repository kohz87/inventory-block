# GR-STU — Story Studio item form for gear (USER approved mockup round 6 on 3 Nov)

Approved mockup: https://claude.ai/artifact/DE52d6FCt7Zijwn1R1wKqc (v6); Studio shots
$S/grm/shots/after-studio-items-{d,p}.png and the Studio section of $S/grm/mockup.html. Build exactly that.

Rules: cleanup-briefs/X-COMMON.md hard rules in full (secrets, user data, exact trailer, own clone $S/grs/, push only
your branch, never merge/PR/force/tag, no version bump/CHANGELOG, never weaken/skip/delete a test — pinned changes
named, the repo's own check + full test + `git diff --check` green before push, PID files only, never
`playwright install`; Chromium /opt/pw-browsers/chromium). If any command is denied, stop that step and report it;
never re-run it in another form. Commit messages end with exactly:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Repo: https://github.com/kohz87/Story_studio, base origin/main. Branch `stage55/gear-items`. Rebuild dist the way the
repo does (read its README/CONTRIBUTING) and commit dist if the repo commits it.

## Build (Items form)
The field names must match Story Block's pack item validation on origin/stage52/gear-inventory (clone
https://github.com/kohz87/Story_block read-only to $S/grs/sb and read src/v2/domains/gear.js, inventory.js def checks
and src/v2/packs/validate.js — do not edit it): Slot select (none + Head, Body, Cloak, Feet, Weapon, Off-hand,
Accessory; Bag is not a slot — it uses Carry); Rarity select (common/uncommon/rare/epic/legendary) showing its stat
budget (0/1/2/3/4); a stat picker (STR/DEX/AGI/VIT/INT/WIS/LUK or the pack's stat set — read SB for the list) with up to
2 stats whose points sum to at most the budget (inline error otherwise); Carry (existing if present). Old packs with no
gear fields load and save unchanged (byte-identical export).

## Tests
Form round trip (load → edit → export → SB-valid shape), budget limit, 2-stat limit, old pack unchanged. Shots 1440 and
390 of the built Items form into $S/grs/shots/.

## Report
Branch + head; what changed; tests; shot paths; open questions (any SB field-name mismatch). Short.
