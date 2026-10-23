# 011: an extensive read-only review of the whole v2 UI stage, with Sol 6.1 at xhigh effort (Codex CLI)

The owner asked for this model: "sol 6.1" at **xhigh** reasoning effort, through Codex CLI. From now on, use it for every review job unless a job says otherwise.

1. Find the exact model name Codex CLI uses for Sol 6.1 (`codex --help`, `~/.codex/config.toml`, or what the owner tells you). If you can't work it out, ask the owner rather than guessing.
2. Make fresh copies of the four repos on v2 in /tmp/rev011/ (clone each one and `checkout v2`). Print each HEAD.
3. In /tmp/rev011, run:
   `codex exec --sandbox read-only -m <sol-6.1 model name> -c model_reasoning_effort="xhigh" "$(cat ~/story_suite/inventory-block/vm-jobs/011-prompt.txt)" > ~/story_suite/vm-results/011-sol.md 2>&1`
   It may take a long time. Let it finish. If it stalls with no output for 20 minutes, stop it and rerun it once.
4. Report as VM JOB 011:
   - the HEADs;
   - the model name and effort used;
   - the verdict;
   - every BLOCKING item in full, in the message;
   - the SHOULD-FIX and NIT counts, with their headlines.
   The full output goes in the results file. If the message gets long, split it into parts "VM JOB 011 (1/2)" and so on.
5. Delete /tmp/rev011.
