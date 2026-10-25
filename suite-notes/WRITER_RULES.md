# Writer rules (added to every writer and reviewer prompt by the lead)

- Tests, post-fix only (USER):
  - No baseline suite before editing; CI on the current head is the baseline.
  - Write the fix and its regression test. To prove the test catches the bug, revert only that fix and run only that test file.
  - After all fixes, run the full check, suite, fuzz and module suites once, then push.
  - Reviewers don't re-run the suite (CI did); they run single tests only to reproduce a finding.
  - Dot reporter; print only the summary line and failures.
- No CHANGELOG, README or contract-doc edits; the lead adds those on merge.
- No model names in repos. Commit trailers as given by the lead.
- Never force-push, rebase a shared branch, or delete branches; merge main with a merge commit.
- Agents never merge; the lead merges.
- Reviews (lead, trial): every finding carries a tag, [normal play] (swipe, delete, Re-read, Continue, reload, crash, settings change, chat switch) or [damaged file] (needs a hand-edited or corrupted chat file). Blocking judgments are unchanged for now; the USER decides after one more round whether [damaged file] findings stop blocking merges.
- STOPPING RULE for track E (USER approved, 24 Oct): reviewers mark each blocking finding as either
  [silent wrong state] (in normal play: swipe, delete, Re-read, Continue, reload, crash, settings change, chat switch, failed save) the story or a module ends up with wrong state with no Problem, refusal or failure shown, or
  [fails safe] (a refusal, STALE/FAILED, a Problem, an inactive block, a lost notice, a damaged-file case, or a performance issue).
  The lead merges a track E package when a re-check finds no [silent wrong state]. [fails safe] items become tracked fixes for integration (V2_LOG "E follow-ups").
- FROM 25 OCT (USER): the stopping rule applies to EVERY track (A, B, C, E, Studio, stage 5). Only [normal play][silent wrong state] blocks a merge; [fails safe] and [damaged file] findings go to the follow-up list. AT MOST ONE fresh re-check per PR after its first review: after that the lead reads the fix diff and merges when CI is green, unless the diff is large or changes identity/replay code. Reviewers report blocking findings only (no hunting for edge cases); users' bug reports drive later fixes ("let people report the bugs to fix specifically rather than mine for them").
