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
