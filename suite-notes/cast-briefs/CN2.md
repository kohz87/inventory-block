# CN2 — NPC State Delta: secrets for everyone
Read C-COMMON.md first, and src/npc-meters.js "Hidden notes" (today: reader-written only, unlock by meter, text sent
only when unlocked + present). Repo kohz87/npc_state_delta, branch `stage33/secrets` from origin/stage32/key-people
(2aea5c3). Test ST port 8187. Agent CN1 hands pack secrets to you in the existing shape + optional `when`.
1. Rule `when` (a story event, ≤ 120 chars) beside `meter`+`at`. The scan checks only PRESENT NPCs' event-locked
   secrets (short list) and opens one when the reply shows the event; recorded on the reply (swipe undoes, Re-read
   keeps). Lean scans every 3 replies (a late open is fine). The reader can open/close by hand in the editor.
2. Generated secrets: the first full scan that builds an NPC's dossier also writes 2–5 layered secrets (USER: up to 5; count by how deep the character is; light → deep;
   rising meter values or a story event), consistent with the background; only dossier NPCs. Never rewritten by later
   scans (every secret is fixed once written). Setting under NSD's own settings, on by default.
3. Injection (USER): locked secrets ARE sent while the NPC is present, worded "hidden: never state or reveal; let it
   shape how they act"; opened ones "known to the player now; may come out". Counted in NSD's budget (over budget:
   nearest to opening first). Byte-identical injection for NPCs with no secrets.
4. Screen (mockup C5, v8): a "Secrets" section right after "Background / History" (+ a "Secrets" jump chip):
   heading "Secrets · n opened · m still hidden"; opened = title + "Opened · Trust 20" pill + text; hidden = a blank
   striped bar + "Opens at Trust 60" / "Opens with the story" (never the title or the event wording). No lock emoji.
5. "What's sent each reply" (Story Block's view of module text): locked secret text shows as "1 hidden note", never
   the text (find how NSD's text reaches that view; if it needs a Story Block hook, describe it — do not edit SB).
Report: head SHA, counts, shots, the hand-over shape for CN1.
