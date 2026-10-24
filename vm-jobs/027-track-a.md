# 027: Track A, quest extraction and item slot routing (Sol writes, Gemini helps)

USER: offload track A to the VM; it runs alongside track E's last rounds. Codex accounts per the README (A, then B). This
job lifts the read-only rule for one work folder and one branch per repo: Codex and agy may edit files in /tmp/awork, and
Sol may push branch `track-a` of kohz87/rpg_battle and of kohz87/Story_director. Nothing else: no PR, no merge, no
other branch or repo (Story Block and NSD are read-only here). agy may run with --dangerously-skip-permissions (VM ST is a
throwaway); the writer still never pushes. Test rule per the README: one baseline is NOT needed (CI covers main);
post-fix runs only. It can take several hours; on a quota stop, commit WIP ("WIP track A <task>: <state>", no trailer
lines), push `track-a`, and report, so the lead can write a resume.

Spec, read first (the contract wins over everything): `~/story_suite/inventory-block/suite-notes/RB_PHASE0.md`, the frozen
contract: §1 ownership, §3 interface (P07, P14, P23, rules.equipPlan, quest commands/queries), §4 boundary data and identity,
§5 rules at the seams, §6 replay recording (guards, claims), §10 "A: extraction map" and the deliverables table (who owns
which folder; lead-owned files), §10 C15 (neutral threads) and the golden fixture trace. Also `RB_TRACK_B_DESIGN.md` B5 (what
settlement guards look like) and Story Block's `docs/v2/REPLAY.md` + `docs/v2/EVIDENCE.md` on branch track-e/e5-evidence
(the ctx.replayGuard, claims and ctx.proof / story.evidence APIs this track uses).

1. Work folder:
   `rm -rf /tmp/awork && mkdir /tmp/awork && cd /tmp/awork`
   `git clone -q https://github.com/kohz87/rpg_battle.git && git -C rpg_battle checkout -q -b track-a origin/main`
   `git clone -q https://github.com/kohz87/Story_director.git && git -C Story_director checkout -q -b track-a origin/main`
   `git clone -q https://github.com/kohz87/npc_state_delta.git` (read-only, for the A audit)
   `git clone -q https://github.com/kohz87/Story_block.git && git -C Story_block checkout -q origin/track-e/e5-evidence` (read-only)
   Print all HEADs. `npm ci` (or `npm install`) in each.
   Re-sync the testkit into RB and SD from that Story Block: `node /tmp/awork/Story_block/scripts/sync-testkit.mjs /tmp/awork/rpg_battle`
   (and Story_director), commit in each as "Vendor Story Block testkit <short sha>". Story Block's E1/E5 are still in final review;
   when the lead says so, re-sync from main.
2. Run Sol as writer and monitor in /tmp/awork (it needs network for agy and the pushes):
   `CODEX_HOME=<account> codex exec --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -m gpt-6.1-sol -c model_reasoning_effort="high" "$(cat ~/story_suite/inventory-block/vm-jobs/027-prompt.txt)" > ~/story_suite/vm-results/027-codex.md 2>&1`
   (put agy's Gemini Flash model id, as in job 014, where the prompt says <GEMINI_FLASH_ID>).
3. Check its work yourself and report failures rather than fixing them. In RB and SD: `git log --oneline origin/main..track-a`;
   `npm run -s check` and `npm run -s test:dot` once; `git diff --stat origin/main`; `git diff --check origin/main HEAD` clean;
   `git grep -n -i -E "gemini|codex|claude|antigravity|gpt" track-a -- src tests docs` shows nothing new.
4. Report as VM JOB 027: both heads, test and check results, one line per task A1–A6 (done / left, with what's left), the
   lead-owned patch commits (hashes), the A5 audit result, which Codex account ran it, and anything Sol stopped on.
5. Keep /tmp/awork until the lead acknowledges 027.
