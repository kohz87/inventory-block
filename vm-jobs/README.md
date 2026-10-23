# VM test-runner jobs

The Story Suite coordinator (a cloud session) posts jobs here. The VM session runs them and reports back.

## Protocol
- Jobs are files `NNN-<name>.md`, numbered in order. Run each job once, in number order.
- After running one, send its result to the coordinator session with SendMessage. In ListAgents it is the session titled "Inventory block UI options" (use the name and ref exactly as your ListAgents prints them). Start the message with `VM JOB NNN:`.
- Also write the result to `~/story_suite/vm-results/NNN.md` on the VM.
- Keep a list of done job numbers in `~/story_suite/vm-results/DONE` so a restart doesn't run a job twice.
- Check for new jobs by running `git -C ~/story_suite/inventory-block pull -q` every 5 minutes while idle.

## Standing rules (apply to every job)
- Never open, print or copy SillyTavern's secrets file or any API key. Never put keys in logs, reports or messages.
- Never read the user's own chats, characters or personas. Use a separate test data root (`--dataRoot`) for test instances, never the default one.
- Never push, merge, comment on GitHub or touch `main`, unless a job says so explicitly.
- Real model (Gemini) only when a job names the connection profile to use, and only for the reply count it gives.
- Stop every server and browser you start before reporting.
- If a job is unclear or blocked, report that instead of guessing.
- Other tools (Codex CLI, Antigravity) run read-only, as reviewers, unless a job says otherwise.
