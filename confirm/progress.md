# Confirm soak progress

One line per 200-reply window (medians over send/swipe/regenerate/continue replies; saves and MB over sends). SillyTavern context 16,384 (reply 300).

## Confirm soak (v2 at 6ae03aa / 73b3cbb / ad7d396 / 37addac, 16k context)

| replies | saves/send | MB up/send (med) | chat file MB | send→request ms (med) | capture ms (med) | prompt build ms (med) | heap after GC MB (max) | DOM nodes (end) | rebuild==live (runtime) | stuck (cum.) | dropped history (cum.) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1–200 | 3.99 | 4.08 | 2.20 | 1,186 | 486 | 421 | 214.0 | 24,123 | 3/3 | 0 | 0 |
