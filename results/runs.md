# Fuzz runs

| Pass | Started (UTC) | Heads | Area | Seeds × steps | Alarms | Real |
|---|---|---|---|---|---|---|
| 1 | 00:15 | SB e0fd33b RB 924b9a3 SD f001974 NSD 5243d79 | a3 features | 250×100 (25,000 steps) | 237 bad seeds → C3-1..4 | 4 |
| 1 | | same | a2 capture | ~23,700 replies | 5 classes → C2-1..6 | 6 |
| 1 | | same | a4 storage | 200×100 + 40×150 cp + 20×80 stfail | 0 inv 1/7 from fuzz; 5 from probes | 5 |
| 2 | | SB 5ef7ead SD affde13 | a3 features (+edits, corruption, rewind, branch, Re-read, mid-gen/mid-save toggles) | 250×400 (100,000 steps, 28,499 toggles) | 1 seed (= C1-1) | 1 (C3-5) |
| 3 | | SB cb2d70e SD a8d428f | a3 pack-data fuzz + toggle re-run | 800 pack mutations; 100×200 (20,000 steps) | 0 | 0 |
