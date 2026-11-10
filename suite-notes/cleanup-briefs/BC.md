# BC — bug: "Could not make the character: There is no state to change yet." (USER, 2 Nov)
Rules: X-COMMON.md hard rules (own data copy, never open secrets.json or user data, PID files from the started process,
never pkill -f/pgrep -f, never playwright install, never touch rpg_battle; exact trailer; push only your branch; no
version bump/CHANGELOG; a test per fix run after it; check + full test + diff --check). If any command is denied, stop
that step and report it; never re-run it in another form. Fresh folder $S/bc/ (never delete outside it); ST port 8211.
Released mains: Story Block 71244cd (2.16.2), Story Director cc0d8b2 (2.9.1), NPC State Delta 81b6a21 (1.7.2).
The message comes from src/v2/commands.js transact(): `store.head()` is not a record (the chat has no Story Block state
yet). The New character wizard (src/v2/lean-rpg/view/wizard.js create()) calls `dm.define` → fails with it.
1. Find every ordinary way a reader reaches the wizard while head() is null. Try in real ST with the RPG on: a brand-new
   chat with a greeting; a character with NO first message (empty chat); a group chat; right after /newchat before the
   page settled; after swiping the greeting; after deleting all messages; a chat opened while Story Block was off, then on;
   the Ersveil character and a plain one. Also read when Story Block writes the first state (turn.onChatChanged, the
   greeting carrier) and when it does not.
2. Root cause + smallest fix. Expected direction: when the reader acts (a ui command) in a chat that has a message but no
   state yet, Story Block seeds the initial state first (as onChatChanged would) instead of refusing; with NO message at
   all, the wizard explains in one plain sentence what to do ("Start the chat first: the character's first message holds
   the story's state.") instead of the raw refusal. Do not write the fix until you have the repro; then write it on branch
   `stage39/no-state` from origin/main 71244cd with tests (unit + testkit host) and a real-ST proof (desktop + phone shot
   of the wizard succeeding in the case that failed).
Report: repro table (case → result), root cause, fix, head, counts, shots.
