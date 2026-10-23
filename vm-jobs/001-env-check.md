# 001: environment check (read-only, changes nothing)

1. In ~/story_suite: list the folders. For each git repo (Story_block, rpg_battle, Story_director, npc_state_delta, SillyTavern), print the branch and short HEAD.
2. `node -v`, `npm -v`, `nproc`, `free -h`, `df -h ~`.
3. Find out whether these exist, with versions: `codex --version`; the Antigravity CLI (give its exact command name, whether it runs headless with a prompt argument, and how to pick a model such as Opus or "argon high"); `npx playwright --version`; `tmux -V`.
4. `ls -l ~/story_suite/SillyTavern/data/default-user/extensions` (the module symlinks).
5. Is SillyTavern running? `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/`
6. Which model this VM session is running on.

Report all of it as VM JOB 001.
