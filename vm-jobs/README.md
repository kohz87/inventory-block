# VM test-runner jobs

The Story Suite coordinator (a cloud session) posts jobs here. The VM session runs them and reports back.

## Protocol
- Jobs are files `NNN-<name>.md`, numbered in order. Run each job once, in number order.
- After running one, send its result to the coordinator session with SendMessage. In ListAgents it is the session titled "Inventory block UI options" (use the name and ref exactly as your ListAgents prints them). Start the message with `VM JOB NNN:`.
- Also write the result to `~/story_suite/vm-results/NNN.md` on the VM.
- Keep a list of done job numbers in `~/story_suite/vm-results/DONE` so a restart doesn't run a job twice.
- The coordinator cannot reply to messages. It acknowledges each result it received by adding the job number to `vm-jobs/ACK`. If a result is not in ACK about 15 minutes after you sent it, send it once more. Never more than twice.
- Check for new jobs by running `git -C ~/story_suite/inventory-block pull -q` every 5 minutes while idle.

## Standing rules (apply to every job)
- Never open, print or copy SillyTavern's secrets file or any API key. Never put keys in logs, reports or messages.
- Never read the user's own chats, characters or personas. Use a separate test data root (`--dataRoot`) for test instances, never the default one.
- Never push, merge, comment on GitHub or touch `main`, unless a job says so explicitly.
- Real model (Gemini) only when a job names the connection profile to use, and only for the reply count it gives.
- Stop every server and browser you start before reporting.
- If a job is unclear or blocked, report that instead of guessing.
- Other tools (Codex CLI, Antigravity) run read-only, as reviewers, unless a job says otherwise.
- Tests (USER rule): post-fix runs only. Reviews don't run the suite first, because CI has already run on the head; go straight to the review, and run single tests only to reproduce a finding. Writers (Sol, Gemini) run no baseline suite before editing. A writer may run just the new regression test with its fix reverted, to prove it fails; the full check and suite run once, after all fixes, before pushing. Use the dot reporter and print only the summary and failures.

## Codex accounts (when the user has set up more than one)
- Each account has its own Codex home: the default `~/.codex` is account A, then `~/.codex-b`, `~/.codex-c`, and so on. The user signs in to each once, themselves.
- Run Codex with `CODEX_HOME=<that dir> codex exec ...`. If a job names no account, use A first. When an account stops on its 5-hour or weekly limit, re-run the step with the next account that has quota, and report which account ran each job.
- Never open, print, copy or commit anything inside a Codex home (auth.json holds the sign-in). Never put one in a repo, log or message.
- Queue: `vm-jobs/QUEUE.md` lists what to run next, in order, with READY / WAITING / IN PROGRESS. Check it on every hourly poll.
- Codex quota timing (USER): a 5-hour window always lasts at least 1 hour, so when an account runs out and the user hasn't given a reset time, treat it as available again 4 hours after the moment it ran out. A reset time the user states always wins. Note that time in QUEUE.md (the VM may edit only the "Accounts" line) and in your report. Don't retry that account before then; use the other one if it has quota.

## Process safety
Before stopping any queue script or parent process, list its child codex processes (`pgrep -a -P <pid>`); never stop a parent while a job runs under it. Restart the queue reader on its own, leaving running jobs alone.
