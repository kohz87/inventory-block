# BD — the model writes Story Block's own hidden storage (USER, 2 Nov). Root-cause first; fix after the lead agrees.
Rules: X-COMMON.md hard rules; if any command is denied, stop that step and report it; never re-run it in another
form; fresh folder $S/bd/ (never delete outside it); ST port 8212; never open secrets.json or user data.
Mains: Story Block ceeb2a1 (2.16.3), Story Director cc0d8b2, NPC State Delta 81b6a21.
The USER's raw reply (trimmed story, exact tail): $S/bd/reply.txt. The model wrote (a) a v1 envelope
`<!-- STORY_BLOCKS_V1 … -->` and (b) a copy of Story Block's OWN hidden storage comment `<!-- STORY_SUITE_V2 <Changes>…
</Changes><Changes-story>…</Changes-story> -->` (capture.js HIDDEN_MARKER — what SB writes into a message after reading
it), instead of a plain `<Changes>` block. SB reported 4 lines "not applied … in a code block, a quote or an HTML block".
1. Replay this exact reply through the testkit host with Story Director + RPG on (and the Ersveil pack): which lines
   applied, which were refused, what the message looks like after; quests? item? place? dm lines? choices?
2. Why does a model write these? Find where it could have learned them: does the prompt SB/SD/NSD sends ever contain
   `STORY_SUITE_V2` or `STORY_BLOCKS_V1` text (turn.js strips hidden comments from history at l.~691 — verify for every
   path: chat history, Continue, swipes, group, text completion, NSD/SD side calls, What's sent preview)? Any v1 text left
   in SB's instructions or examples? In real ST: a 5-reply chat, then inspect the exact prompt for those markers.
3. Propose the smallest robust fix: e.g. a reply-written (not stored) `<!-- STORY_SUITE_V2 … -->` / `STORY_BLOCKS_V1`
   comment whose body is change lines is read as the reply's block (its <Changes> once; never <Changes-story>/<-echo>
   duplicates; dedupe identical lines), with one Problems line telling the reader the format was off; and stop any leak
   found in step 2. Do not write the fix yet.
Report: replay table, leak findings (with exact prompt excerpts), proposed fix.
