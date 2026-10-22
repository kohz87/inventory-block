# Story Suite live-test harness

Used by cloud test sessions for the Story Suite v2 beta (Story Block, RPG Battle, Story Director, NPC State Delta).
Not part of the Inventory Block extension.

    bash harness/setup.sh                      # SillyTavern 1.19.0 + mock model, once per machine
    bash $SP/instance.sh <name> <st-port> <mock-port> Story_block=<path> rpg_battle=<path> \
         Story_director=<path> npc_state_delta=<path>

- `mock/`: an OpenAI-compatible mock model that answers from files queued in MOCK_Q.
- `smoke/`: live scenario scripts (Playwright / raw CDP; Chromium is preinstalled).
- `break-scripts/`: the long soak generator, driver, rebuild check and analysis.
- `*_BRIEF.md`: rules and invariants for test runs.
