# Confirm soak: the per-window table for one or more runs, side by side.
# usage: python3 confirm-table.py <label>=<run dir> ... [--window 200] [--upto 600]  → markdown on stdout
import csv, json, os, sys, statistics as st
args = [a for a in sys.argv[1:] if '=' in a]
W = int(sys.argv[sys.argv.index('--window') + 1]) if '--window' in sys.argv else 200
UPTO = int(sys.argv[sys.argv.index('--upto') + 1]) if '--upto' in sys.argv else 600
GEN = {'send', 'swipe', 'regenerate', 'continue'}
def f(v):
    try: return float(v)
    except: return None
def med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else None
def last(v): return f(v.split('|')[-1]) if v else None
fmt = lambda v, d=0: '–' if v is None else f'{v:,.{d}f}'
print(f'| Replies | Run | Saves/send | MB up/send | Chat file MB | Send→request ms | Capture ms | Prompt build ms | Heap after GC MB (max) | DOM nodes (end) | Rebuild == live (runtime) |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
runs = []
for a in args:
    label, d = a.split('=', 1)
    rows = list(csv.DictReader(open(os.path.join(d, 'metrics.csv'))))
    rb = [json.loads(l) for l in open(os.path.join(d, 'rebuild.jsonl')) if l.strip()] if os.path.exists(os.path.join(d, 'rebuild.jsonl')) else []
    runs.append((label, rows, rb))
for lo in range(0, UPTO, W):
    for label, rows, rb in runs:
        win = [r for r in rows if lo < (f(r['replies']) or 0) <= lo + W]
        if not win: continue
        g = [r for r in win if r['action'] in GEN and r['ok'] == '1']
        sends = [r for r in win if r['action'] == 'send' and r['ok'] == '1']
        rbw = [x for x in rb if lo < (x.get('replies') or 0) <= lo + W]
        withSuite = [x for x in rbw if x.get('suiteEqualsLive') is not None]
        rbtxt = f"{sum(1 for x in withSuite if x['suiteEqualsLive'])}/{len(withSuite)}" if withSuite else f"store {sum(1 for x in rbw if x.get('headEqualsLive'))}/{len(rbw)}"
        print(f"| {lo + 1}–{lo + W} | {label} | {fmt(st.mean([f(r['saves']) or 0 for r in sends]) if sends else None, 2)} | {fmt((med([f(r['save_bytes']) for r in sends]) or 0) / 1e6, 2)} | {fmt((f(win[-1]['chat_file_bytes']) or 0) / 1e6, 2)} | {fmt(med([f(r['latency_ms']) for r in g]))} | {fmt(med([f(r['capture_ms']) for r in g]))} | {fmt(med([last(r['intercept_ms']) for r in g]))} | {fmt(max([f(r['heap_after_gc']) or 0 for r in win]) / 1e6, 1)} | {fmt(f(win[-1]['dom_nodes']))} | {rbtxt} |")
