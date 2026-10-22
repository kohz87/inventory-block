# Beta soak progress

One line per 250-reply window (medians over send/swipe/regenerate replies; saves and MB over sends).

## Final soak (v2 beta, all merged)

| replies | saves/send | MB up/send (med) | chat file MB | send→request ms (med) | capture ms (med) | prompt build ms (med) | heap after GC MB (max) | rebuild==live | stuck (cum.) |
|---|---|---|---|---|---|---|---|---|---|
| 1–250 | 4.15 | 3.93 | 2.37 | 742 | 276 | 251 | 180.5 | 3/3 | 0 |
| 251–500 | 3.85 | 12.76 | 4.66 | 1,412 | 1,060 | 844 | 242.2 | 3/4 | 0 |

