# REVIEW-SDK — Opus review of Story Block 2.20.0 public API + {{sb::}} macro (read-only)

Read-only. Clone Story_block into $S/rv-sdk/ and read origin/stage64/sdk-api (7bec448 or newer) against origin/main
3eb517b (2.19.0). Contract: SDK-CONTRACT.md; brief SDK-BUILD.md. Blocker bar: crash/wedge (a listener, a macro or an
api.get on a weird path breaking a reply or the page), data loss, wrong results, replay inequality, ANY hidden-value
leak (prompt:false fields, hidden Who, hidden blocks, role blocks with RPG off, secrets from other modules, values in
story:changed/story:reply summaries, the macro's output), macro injection (a value containing `{{…}}` or regex-special
text reaching ST's macro engine unescaped; the zero-width defuse), cost (work done per reply when no listener / no
macro use), the frozen surface promise (can a caller mutate the returned objects or the api?), ST compatibility (new vs
old macro engine; register/unregister; a second register replacing). Never read secrets or the USER's SillyTavern data;
never pgrep -f/pkill -f; if any command is denied, stop that step and report it. Report per finding: file:line, repro,
severity, fix. Short.
