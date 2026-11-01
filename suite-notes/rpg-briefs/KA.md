# KA — Story Director: Key people (approved mockup, 1 Nov)

Hard rules: suite-notes/ui-briefs/UI-COMMON.md (secrets, user data, PID files, no playwright install, no rpg_battle,
exact trailer, no version bump/CHANGELOG, push only your branch, never merge/PR/force/tag, a test per change run after
it, `npm run check` + full `npm test` + `git diff --check` green, browser shots desktop + phone).
Repo kohz87/Story_director, branch `stage32/key-people` from origin/main (1cfe4ec, 2.6.0). Test ST port 8181 with
Story Block main (0a68271, 2.13.0) and npc_state_delta main. Mockup: https://claude.ai/artifact/762b4QY8JkjjNqvLGiJkVu
(script vm-results/u5/mock.mjs). Agent KB builds the NPC State Delta side in parallel and only READS from you.

USER decisions: Story Director owns key people; cap 10 by default (setting); narrator budget 300 tokens by default, no
upper limit (setting; the overall tail budget still caps all); kept in Lean; auto-removed when archived or dead
(NPC State Delta's status) — SD alone: when the story records their death, or Unpin; NSD alone has no key people.

1. State (story state, replay-safe like every SD domain: rebuild == live == reload, swipe/delete exact): the key list
   (name, pinned on, removed + reason), each key person's away record (doing, since, back date, timeline steps).
   Reader actions (Pin, Unpin) ride the latest reply like other edits.
2. Narrator: one new kind owned by a new feature "Key people" (on by default, `presets` omitted so Lean keeps it, and
   NOT inside `story-director.threads`): `+ away Ren — scouting the north road | back: <date>`, `! away Ren — reached
   Wolfmere Outpost` (a timeline step), `- away Ren` (returned), `- key Ren | died` (death; removes the pin). Only
   pinned people may be `away`. Tail: one line per away key person ("Ren: away, scouting the north road, back Gw 18;
   latest: reached Wolfmere"), within the budget, ordered by soonest return, then latest step; over budget, the rest
   are left out of that reply (still tracked). A back date passing does not move anyone by itself: the tail says
   "due back" and the narrator brings them.
3. Removal: with NPC State Delta, read its `npcProfiles()` (or its documented query) each reply; a pinned name that is
   archived or dead there is unpinned with the reason (recorded in state, shown in This reply). Never write to NSD.
4. Screens: World → Now gets "Key people · n of cap" (rows: ★ name, Away · back <date> / Here, what they are doing, last
   step, Unpin; "+ Pin" chooser listing people known to the story: present people, SD threads, NSD profiles), and the
   note with the current token use. The per-reply status card gets the "Ren is back" / "no longer a key person" lines
   in its body and summary. Settings (Modules → Story Director → Key people): the two numbers with the mockup's text.
5. A query for NPC State Delta: `director.keyPeople` → [{ name, aliases?, here: bool, away: { doing, since, back,
   steps: [{ date, text }] } | null, removed?: { reason, on } }] (read-only, frozen copies).
6. Tests for each item; docs (README/CHANGELOG-free; docs/dev or the feature docs) for the kind and the query.
