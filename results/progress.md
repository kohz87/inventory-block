# Beta soak progress

One line per 250-reply window (medians over send/swipe/regenerate replies; saves and MB over sends).

## Run 1 (baseline, v2 at start)

| replies | saves/send | MB up/send (med) | chat file MB | send→request ms (med) | capture ms (med) | prompt build ms (med) | heap after GC MB (max) | rebuild==live | stuck (cum.) |
|---|---|---|---|---|---|---|---|---|---|
| 1–250 | 3.64 | 5.94 | 4.04 | 536 | 247 | 144 | 173.3 | 3/3 | 0 |
| 251–500 | 3.57 | 22.27 | 9.45 | 974 | 950 | 358 | 343.4 | 4/4 | 0 |

