# One line per 250-reply window for results/progress.md: python3 progress.py <run dir> <label> <progress.md>
# Rewrites the "## <label>" section of the file, keeps the others.
import csv, json, os, re, sys, statistics as st
RUN, LABEL, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
rows = list(csv.DictReader(open(os.path.join(RUN, 'metrics.csv'))))
GEN = {'send', 'swipe', 'regenerate'}
def f(v):
    try: return float(v)
    except: return None
def med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else None
def last(v): return f(v.split('|')[-1]) if v else None
rebuilds = []
if os.path.exists(os.path.join(RUN, 'rebuild.jsonl')):
    rebuilds = [json.loads(l) for l in open(os.path.join(RUN, 'rebuild.jsonl')) if l.strip()]
W = 250
lines = []
top = int(max((f(r['replies']) or 0) for r in rows)) if rows else 0
for lo in range(0, top, W):
    win = [r for r in rows if lo < (f(r['replies']) or 0) <= lo + W]
    if not win: continue
    g = [r for r in win if r['action'] in GEN and r['ok'] == '1']
    sends = [r for r in win if r['action'] == 'send' and r['ok'] == '1']
    hi = int(max(f(r['replies']) or 0 for r in win))
    rb = [x for x in rebuilds if lo < (x.get('replies') or 0) <= lo + W]
    rb_ok = sum(1 for x in rb if x.get('headEqualsLive') is True)
    fmt = lambda v, d=0: '–' if v is None else (f'{v:,.{d}f}')
    lines.append(f"| {lo + 1}–{hi}{'' if hi == lo + W else ' (partial)'} | {fmt(st.mean([f(r['saves']) or 0 for r in sends]) if sends else None, 2)} | {fmt((med([f(r['save_bytes']) for r in sends]) or 0) / 1e6, 2)} | {fmt((f(win[-1]['chat_file_bytes']) or 0) / 1e6, 2)} | {fmt(med([f(r['latency_ms']) for r in g]))} | {fmt(med([f(r['capture_ms']) for r in g]))} | {fmt(med([last(r['intercept_ms']) for r in g]))} | {fmt(max([f(r['heap_after_gc']) or 0 for r in win]) / 1e6, 1)} | {rb_ok}/{len(rb)} | {sum(int(f(r['stuck']) or 0) for r in win[-1:])} |")
head = f"## {LABEL}\n\n| replies | saves/send | MB up/send (med) | chat file MB | send→request ms (med) | capture ms (med) | prompt build ms (med) | heap after GC MB (max) | rebuild==live | stuck (cum.) |\n|---|---|---|---|---|---|---|---|---|---|\n" + '\n'.join(lines) + '\n'
text = open(OUT).read() if os.path.exists(OUT) else '# Beta soak progress\n\nOne line per 250-reply window (medians over send/swipe/regenerate replies; saves and MB over sends).\n'
pat = re.compile(rf'^## {re.escape(LABEL)}\n.*?(?=^## |\Z)', re.S | re.M)
text = pat.sub(head + '\n', text) if pat.search(text) else text.rstrip('\n') + '\n\n' + head
open(OUT, 'w').write(text)
print(head)
