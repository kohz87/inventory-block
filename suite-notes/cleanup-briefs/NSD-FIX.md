# NSD-FIX — fix the Opus review findings on NPC State Delta 1.8.0 (stage63/nsd-prose)

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/nsdfix/, push only your branch, never
merge/PR/force/tag, never weaken/skip/delete a test — pinned changes named, a test per fix run after it,
`git diff --check origin/main HEAD`; never pgrep -f/pkill -f). If any command is denied, stop that step and report it;
never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Branch: kohz87/npc_state_delta origin/stage63/nsd-prose (c955f8e, 1.8.0) — commit on it. Probes:
$S/rv-sdnsd/probe-nsd.mjs, probe3.mjs. Full suite on node 24 + compatibility-check + runtime-smoke + npm run check.
1 (BLOCKER) A skipped reply is never scanned: the safety scan reads only the current exchange. When a scan runs (safety
  or triggered), it must read EVERY exchange since the last scan (the replies the local check skipped), within the
  scanner's existing transcript budget (oldest trimmed first if over). Also make the local check safer: a reply counts
  as quiet only when it names no one new AND no tracked NPC is in the scene (present/at the location) — a tracked NPC
  present by pronoun ("She sighs…") must scan. Keep names of any script (no capital-letter requirement for non-Latin
  scripts: treat CJK/other-script name-like tokens as names) and 2-letter names. Tests: each false negative from the
  review (pronoun of a present tracked NPC, "the grizzled guard captain", "美咲", "Bo", "Will smiled") → scan, or covered
  by the next scan reading the skipped replies; a quiet scene with no tracked NPC present → skip.
2 (MED) scan-context.js:20: with "Scan after every reply" off (Story Suite LEAN_OFF), OR in `replyChanges` too.
  Test autoScanDue({autoScan:true, sinceScan:1, scanEvery:5, everyReply:false, replyChanges:true}) → true.
3 (MED) buildInjection header (core-mechanics.js ~6420): restore, shortened, the dropped rules: never mention numeric
  values; durable identity changes gradually unless a time skip; do not flatten distinct voices; the "only them"
  thinking from the LOW SCORES line. Measure the new size.
4 (MED) portrait prose: gender boy/girl must stay boy/girl (never "a 9-year-old man"); with a numeric age under 18 and a
  male/female gender use boy/girl. Test.
5 (LOW) prose grammar: strip a leading "He/She/They has/have" from a sentence-form appearance clause; an adjective-only
  clause ("burly") reads "a burly man …" or "…, burly" rather than "with burly"; a/an by sound ("a unicorn-kin"). Tests.
6 CHANGELOG 1.8.0 wording: say a scan reads every reply since the last one.
Report: head, each item, sizes, tests, pinned changes. Short.
