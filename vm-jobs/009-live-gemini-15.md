# 009: a short live run with the real model (15 replies) on the merged v2 UI

Purpose: check that the suite still plays end to end with a real model after the UI stage merges (Story Block #170/#171, Story Director #123, Delta #212), and see how it looks on a phone. This is the planned small run; the bigger one (about 30 replies) comes in step 8.

Real model: use ONLY the SillyTavern connection profile named `gemini-3.8-flash`, and send at most **15** replies in total, swipes and retries included. Stop at 15 even if something is unfinished. Never open, print or copy the secrets file or any key.

1. Update the four checkouts to v2 by fast-forward only (as in job 002, step 1) and print each HEAD. If a pull won't fast-forward, stop and report.
2. Start a SillyTavern test instance with a SEPARATE data root (not the default one, not the user's data), with the four modules enabled from ~/story_suite. Its secrets file may only be read by SillyTavern itself. If the profile isn't usable from a fresh data root, don't copy secrets: report it and stop.
3. Make a fresh test character (a short fantasy guild-town opening; no real people, nothing explicit). Use a fresh persona named "Tester".
4. Play 15 replies, with moves that touch every module:
   - accept a quest;
   - talk to two named NPCs;
   - travel to a second place;
   - pick up an item;
   - start and finish one small fight;
   - spend points if offered.
5. After replies 1, 5, 10 and 15, record:
   - the Story Block state and changes card (Home);
   - Story Director's World (Now/Here) and Quests;
   - Delta's present cards and Dossiers;
   - rpg_battle's Party and HUD;
   - any console errors (the text, without chat content);
   - the reply time.
6. Screenshots:
   - phone (Playwright devices['Pixel 7'], 390): the game view on Home, Party, Quests and World, after replies 5 and 15;
   - desktop 1280: the same.
   Save them under ~/story_suite/vm-results/009/.
7. Report as VM JOB 009:
   - the HEADs;
   - replies used (of 15);
   - per module, whether it updated as expected (yes, partly or no, with one line why);
   - errors with counts;
   - average and slowest reply time;
   - anything that looked broken in the screenshots.
   Don't paste chat text beyond a few words per finding.
8. Stop SillyTavern and the browser. Keep the test data root, so the step 8 run can reuse the character.

## Update (after the first report): blocked on the profile
Correct call: don't copy secrets. The VM owner will add the Gemini key and the `gemini-3.8-flash` profile to the test instance (data root ~/story_suite/vm-test-data/009, port 8011) through SillyTavern's own UI. When the owner says it's done, re-run from step 2. Use that data root and start SillyTavern on 8011 for the owner if they ask.

## Update: the reply budget is now up to 100 (owner's decision, 23 Oct)
The VM owner has fixed the preset, and the model replies now. The owner also says the character was not actually created: check in the UI that it exists before going on, and create it there if it doesn't. Persona: use the instance's own persona if the owner already allowed it; otherwise "Tester".

New budget: up to **100** replies with `gemini-3.8-flash`, swipes and retries included. This run replaces the 30-reply run planned for step 8, so cover more:
1. Replies 1–15: the original list (a quest, two NPCs, travel, an item, a small fight, spending points).
2. Replies 16–40:
   - a longer fight with several turns, using a skill;
   - craft or order something, and sell something (Trade);
   - make a save point;
   - talk to one NPC three more times (check Delta's stage and meters change);
   - finish or abandon a quest.
3. Replies 41–60:
   - swipe one reply twice (check the state follows the chosen swipe);
   - delete the last message and check the state rolls back;
   - load the save point.
4. Replies 61–100 (stop earlier if everything is clean by 80): free play through 3+ places and 3+ quests. Note any drift: the state disagreeing with the story, duplicated NPCs, a stuck quest, a wrong time or weather.
5. Record what step 5 asked for after replies 1, 5, 10, 15, 25, 40, 60 and the last one. Take screenshots (phone 390 and desktop 1280) after 15, 40 and the last.
6. In the report: replies used; per module, a yes/partly/no with one line why; every bug, with the reply number and a short description (a few words of chat at most); errors with counts; average and slowest reply time; drift notes. Check your own claims against the screenshots before reporting.

## STOP-CHECK before any more replies (owner's report: the run isn't using the extension)
The owner says the replies so far are plain narration: Story Suite isn't taking part. Before sending more:
1. In the :8000 page, confirm the Story Suite bar (Story, Game view, Suite) is above the message box, and that Settings → Diagnostics lists Story Block, rpg_battle, Story Director and npc_state_delta, all on v2.
2. Confirm the assistant replies carry the suite's records, i.e. Diagnostics shows "Replies with a Story Suite record" going up, and the reply note under each reply shows changes.
3. If the extensions aren't enabled or loaded, report exactly what you see and wait for the owner. Don't install or enable anything outside the four ~/story_suite checkouts.
Only then go on with the replies. Replies sent without the suite active don't count towards the job's checks.

## CANCELLED (owner's decision, 23 Oct): don't run any more of this job
Stop now. Send no more replies. Stop any browser or driver you started. Leave the :8000 instance as the owner set it up. Report "VM JOB 009: cancelled" with the number of replies actually sent. Codex review jobs (010 and later) continue as normal.
