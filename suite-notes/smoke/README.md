# Live smoke harness (lead's own SillyTavern)

Rebuild after a container restart: `bash suite-notes/smoke/setup.sh [ref]` (clones SillyTavern 1.19.0, separate data root, the four extensions at `ref`, mock API settings, the Ersveil pack from Story Block).

- SillyTavern 1.19 at /home/user/st-smoke/SillyTavern, port 8150, data root /home/user/st-smoke/data (never the user's).
- The four extensions are cloned into data/default-user/extensions (update with `git -C <ext> pull`). The Ersveil pack is
  installed by writing `extension_settings.storySuite.packs` in data/default-user/settings.json (stop the browser first).
- `mock.mjs`: scripted OpenAI-compatible model on 127.0.0.1:5001 (story turns from script.json; NSD dossier scans get
  `{"npcs":[]}`); restart it after editing script.json. Start with a PID file:
  `cd suite-notes/smoke && (nohup node mock.mjs > /home/user/st-smoke/mock.out 2>&1 & echo $! > /home/user/st-smoke/mock.pid)`.
- `run.mjs [--steps=delete,swipe,reload]`: new chat, Wessel via the creation wizard (create.mjs), the scripted turns,
  then history edits; report at /home/user/st-smoke/report.json. `rcpt.mjs` lists every receipt of the current chat.
- Time lines use the pack calendar: `~ time CY 611, Goldwane 12, 8:00 am`, `! time +1h`.
- Never stop processes with `pkill -f`/`pgrep -f` patterns (they match the shell itself); use the PID files.
- `MOCK_PROMPTS=<file>` makes `mock.mjs` log every full prompt (JSON lines), to check told terms, one-shot lines and lorebook constants.
- `ersveil/`: Ersveil 1.0.0 smoke helpers (27 Oct): `mkscript.mjs` writes the 32-turn Ersveil `script.json`; `lib.mjs` (output folder `SMOKE_OUT`, default /home/user/st-smoke/ersveil), `turn.mjs`, `qq.mjs` (queries), `fightall.mjs` (drives the Fight tab; its button matches `/Fight/`), `history.mjs` (delete/swipe/reload snapshots).
