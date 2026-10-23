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
