# NSD-PROSE — NPC State Delta: real natural-language portrait prompts (USER 3 Nov; uses Krea 2)

Rules: X-COMMON.md hard rules in full (secrets, user data, own clone $S/nsdprose/, push only your branch, never
merge/PR/force/tag, no version bump/CHANGELOG, never weaken/skip/delete a test — pinned changes named, a test per change
run after it, `git diff --check origin/main HEAD`; never pgrep -f/pkill -f). If any command is denied, stop that step and
report it; never re-run it in another form. EVERY commit ends with EXACTLY:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Qp9gtHxXEZNRVLhbUujNYu

Repo https://github.com/kohz87/npc_state_delta, base origin/stage59/lean-nsd (a5552a8 — the prompt-diet branch; it ships
together). Branch `stage63/nsd-prose`. Full suite: `npx -y node@24 --import ./tests/active-runtime-test-setup.mjs
--test tests/*.test.js tests/v2/break/*.test.js`.
Today core-mechanics.js `buildPortraitPrompt` (≈ line 3760) "natural" format emits labelled fields ("Subject: …
Appearance: … Role: …"). Make "natural" write fluent descriptive prose from the same fields, the way modern
natural-language image models (Flux-family, Krea) read best: one or two short paragraphs, subject first, concrete
visual details, no labels, no tag syntax, no weights. Example shape: "A portrait of a 21-year-old fox-beastfolk woman
with russet fox ears, the left one notched, and long tousled deep-red hair under a grey veil embroidered with a gold
flame-sun. She wears a patched ash-grey habit and flame-cross pendants. Her expression is <mood>. Behind her, <setting>.
<composition>. <style>." Rules: keep every fact the fields give (identity, apparent age, appearance groups, clothing,
role as a visual cue only, mood, location, composition, extra positive, style); grammatical joins (commas, "and");
no duplicated words across clauses; gender-neutral wording when gender is unknown (use the name or "the person");
never invent details. Negative prompt unchanged. Hybrid and Tags unchanged byte-for-byte (tests). Length cap as today.
Also: the setting's help text says Natural suits natural-language models (Flux, Krea, SD3-class) — text only, no new UI.
Tests: prose for a full dossier, sparse dossier, unknown gender, mood/location off, extra positive, replaceAutomatic;
hybrid/tags byte-identical to base. Report: head, 3 sample prompts (full, sparse, unknown gender), tests, pinned
changes. Short.
