# World → Now clean-up (USER approved 2 Nov). Mockup https://claude.ai/artifact/DrUffpTSf8vwt7Vde7MozM;
# texts and code places: vm-results/u11/NOTES.md (read it fully) and vm-results/u11/mock.mjs.
Rules: X-COMMON.md hard rules (exact trailer, push only your branch, never merge/PR/force/tag, no version bump or
CHANGELOG, a test per change run after it, check + full test + diff --check green, PID files, never pkill -f, never
playwright install, never touch rpg_battle). No scrollIntoView and no bare focus(): use Story Block's view/scroll.js
helpers. If any command is denied, stop that step and report it; never re-run it in another form.
USER decisions: People here shows portrait, name, standing chip, the pack/dossier description cut to 1 line (2 on phone),
the whole row opens the dossier; the Look line, "Next:" stage line, custom fields and every hidden-note row leave World
(the dossier and the Dossiers screen keep them). Around here: the place shortens with "…" (full place as tooltip), the
time of day ("· morning") is dropped first when room is short. Key people: the Pin list stays inside the card and
scrolls there. Bases: Story Block main 768c41a, Story Director main d972c4f, NPC State Delta main 64af0ac.
Real-ST check (own data copy, never open secrets.json) with the Ersveil 2.4.1 zip and a met cast person; shots desktop
1440×900 + phone 390×844 matching the mockup into your folder. Report: branch, head, changes, tests, counts, shots.
