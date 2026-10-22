# B5b robustness report (saved by coordinator from hand-back)
Heads: SB a1cf5b1, RB 7b75abc, SD 028d70b. 13 findings (0 crit, 3 high, 5 med, 5 low). Tests: tests/Story_block (22, + helpers/suite-b5b.js), tests/Story_director (4), tests/rpg_battle (1, uses repo's integration helpers/host.js). Repro scripts in repro/ (pw-forms.mjs, pw-deep.mjs, regex-scan2.mjs).
SB:
- 1 MED form control named classList/setAttribute/removeAttribute → form stuck busy (render.js:515-528 busy(); HTMLFormElement LegacyOverrideBuiltIns). Fix: refuse/drop control names/ids `in HTMLFormElement.prototype` (sanitizer + pageValue) or prefix control names; call DOM via prototypes; move running=true inside try. Test b5b-form-names.
- 2 LOW name="disabled" → all submits no-op (render.js:532,549). Fix with 1; use :disabled.
- 3 MED names addEventListener/appendChild/insertBefore/classList/style → screen fails to draw (render.js 371-380, 279/331, 432, 424). Fix with 1.
- 4 LOW bound name via data-bind-attr same as 1 (render.js:400→71-77).
- 5 HIGH capture.js quadratic on whitespace runs: /\s+$/ (:86,:101), /\n\s*$/ (:75,:100), TEXT_DASH (:22), LABELLED (:24). 20K spaces ≈3s, 40K ≈8s. Fix: trimEnd/loops, indexOf for dash/label, cap line length. Test b5b-capture-timing.
- 6 HIGH turn.js stripHistory re-runs extract/strip over every assistant message each prompt → +1.25s per later reply. Fix: 5 + includes('<Changes') precheck + per-text cache.
- 8 MED 1000-deep template (5KB) installs then stack-overflows every draw (sanitize.js:211-224 filterNodes; template/index.js:63/174). Fix: depth cap 64–128 in parseHtml + pack validation. Test b5b-deep-screens.
- 9 HIGH scopeCss cubic in @-rule nesting (css.js:311-326 readItems :74, indent :340): 52KB → 35s. Fix: cap @-depth ~8 in unsafeCss + scopeCss, no re-indent, index ranges. Test b5b-deep-screens.
- 10 LOW persona name substituted raw (turn.js:60-71 substituteNames at :268-269, after budget): newline forges [Happened] in static+tail; 100KB name → 226K-token static. Fix: flatten + clip ~80, budget after substitution. Test b5b-prompt-hygiene.
- 12 LOW text setting max never applied (host-ui.js:97-101; sdk.js:85-88). Fix: maxLength + schema validation in settings.set. Test b5b-settings-size.
- note: `</Changes>` mid-line ends the block, later lines dropped silently (capture findBlocks) → b1 area.
SD:
- 7 MED src/changes.js quadratic: KEY_DASH :69, LABELLED :73, split(/\s*\|\s*/) :197 (v2 tracker capture.js:104). Fix: indexOf splits or reuse SB's parsed line. Test b5b-changes-timing.
- 11 LOW calendar era/month from settings unflattened into tail (calendar.js:104, :73; note.js). Fix: flatten + cap 24/40 in normalizeCalendar/toMonth. Test b5b-calendar-lines.
RB:
- 13 MED join capture list split quadratic (party/capture.js:81); clip label values ~200 then split /[,;/]/ + trim. Test b5b-join-timing. ~20 more quadratic regexes in src/story.js (only clipped text today).
Held up: static byte identity across names/NSD rules; names flattened in tail from packs; safety.js/css.js/html.js regexes; SD quests/parse + tracker v2; pack size limits (10MB refused 38ms, deep JSON refused, 2MB/64KB caps); brief's form-name list harmless; form names/ids prefixed.
