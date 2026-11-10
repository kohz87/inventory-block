# STU-FIX222 (4 Nov) — fixes from rv222-studio ($S/rv222-studio/REVIEW.md, read it first)
Claude builder agent. Rules of CARD-COMMON.md and GEN22-COMMON.md apply (exact trailer, no model names, no merge/PR/
force/tag, never weaken tests, no playwright install). If any command is denied, stop that step and report it; never
re-run it in another form. Shared machine: --test-concurrency=2.
S = /tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad
Fresh clone $S/stu-fix222/Story_studio. Commit on the existing branches (no new branches) and push both.
On `stage66/cast-skills` (c2ce3a7):
1. BLOCKER — store stat lowercase: SKILL_STATS from LEAN_RPG_LIMITS.stats (labels upper-cased only in the option
   text); skillView keeps the stored value; newSkill starts at 'str'; the stopgap checker compares stat/uses/rank
   exactly (as SB) and applies SB's plain-text rule (no < > { } |). Update tests expecting capitals. One test: a skill
   added + edited in the browser form exports stat:'int' and SB's validatePack (from SB origin/stage66/skills,
   d81df59, loaded in the test or via the reviewer's $S/rv222-studio/tools/interop.mjs approach) accepts the pack.
2. Skill cap follows CAST_LIMITS.skills ?? 5 (8 after the vendor re-sync). Test: with a vendor exposing 8, six skills
   are accepted and the title reads "of 8".
On `stage66/studio-tabs` (27cdd7b):
3. Hide "Tab title" when joining a tab another screen already titles (or show a one-line hint "Title set by <screen>";
   prefer hiding). Test per the review.
Do NOT re-sync the vendor yet (the lead does it at release from the final SB 2.22.0). Rebuild dist on each branch.
npm run check, full suite, git diff --check on each. Report: both heads, tests with counts.
