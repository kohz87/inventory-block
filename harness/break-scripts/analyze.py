# Summary tables from a soak run: python3 analyze.py <run dir>  → prints markdown, writes <run>/windows.csv
import csv, json, os, sys, statistics as st
RUN = sys.argv[1]
rows = list(csv.DictReader(open(os.path.join(RUN, 'metrics.csv'))))
import glob
summary = json.load(open(sorted(glob.glob(os.path.join(RUN, 'summary-*.json')))[-1]))
gen = {'send', 'swipe', 'regenerate'}

def f(v):
    try: return float(v)
    except: return None

def last_part(v):
    return f(v.split('|')[-1]) if v else None

def pct(xs, p):
    xs = sorted(x for x in xs if x is not None)
    if not xs: return None
    return xs[min(len(xs) - 1, int(round(p / 100 * (len(xs) - 1))))]

W = 250
out = []
maxr = int(max(f(r['replies']) or 0 for r in rows))
for lo in range(0, maxr + 1, W):
    win = [r for r in rows if lo < (f(r['replies']) or 0) <= lo + W]
    g = [r for r in win if r['action'] in gen and r['ok'] == '1']
    sends = [r for r in win if r['action'] == 'send' and r['ok'] == '1']
    if not win: continue
    out.append({
        'replies': f'{lo + 1}-{lo + W}',
        'capture_med': pct([f(r['capture_ms']) for r in g], 50), 'capture_p95': pct([f(r['capture_ms']) for r in g], 95),
        'intercept_med': pct([last_part(r['intercept_ms']) for r in g], 50), 'intercept_p95': pct([last_part(r['intercept_ms']) for r in g], 95),
        'latency_med': pct([f(r['latency_ms']) for r in g], 50), 'total_med': pct([f(r['total_ms']) for r in g], 50), 'total_p95': pct([f(r['total_ms']) for r in g], 95),
        'saves_per_send_mean': round(st.mean([f(r['saves']) or 0 for r in sends]), 2) if sends else None,
        'save_mb_per_send_med': round((pct([f(r['save_bytes']) for r in sends], 50) or 0) / 1e6, 2),
        'file_mb_end': round((f(win[-1]['chat_file_bytes']) or 0) / 1e6, 2),
        'ss_mb_end': round((max([f(r['storysuite_bytes']) or 0 for r in win]) or 0) / 1e6, 2),
        'head_kb_end': round((f(win[-1]['head_bytes']) or 0) / 1e3, 1),
        'heap_gc_mb': round((max([f(r['heap_after_gc']) or 0 for r in win]) or 0) / 1e6, 1),
        'dom_end': f(win[-1]['dom_nodes']),
        'cards_end': f(win[-1]['ss_cards']),
        'sb_tail_tok_max': pct([f(r['sb_tail_tokens']) for r in g], 100), 'sb_tail_tok_med': pct([f(r['sb_tail_tokens']) for r in g], 50),
        'nsd_tail_chars_max': pct([f(r['nsd_tail_chars']) for r in g], 100),
        'prefix_send_med': pct([f(r['shared_prefix_pct']) for r in g if r['action'] == 'send'], 50),
        'prefix_swipe_med': pct([f(r['shared_prefix_pct']) for r in g if r['action'] != 'send'], 50),
        'problems': sum(f(r['problems']) or 0 for r in win), 'console_err': sum(f(r['console_err']) or 0 for r in win), 'console_warn': sum(f(r['console_warn']) or 0 for r in win),
        'extra_calls_end': f(win[-1]['extra_calls']),
    })
with open(os.path.join(RUN, 'windows.csv'), 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
cols = list(out[0].keys())
print('| ' + ' | '.join(cols) + ' |'); print('|' + '---|' * len(cols))
for o in out: print('| ' + ' | '.join('' if o[c] is None else str(o[c]) for c in cols) + ' |')
static_sb = [c for c in summary['staticChanges'] if 'part' not in c]
print('\nSB static changes:', len(static_sb), static_sb[:10])
parts = {}
for c in summary['staticChanges']:
    k = (c.get('part', 'sb'), c['action']); parts[k] = parts.get(k, 0) + 1
print('static/system-prefix changes by part and action:', parts)
print('static shas seen:', sorted({r['static_sha'] for r in rows if r['static_sha']}))
print('stuck', summary['stuck'], 'stuckReloads', summary.get('stuckReloads'), 'driverErrors', summary.get('driverErrors'), 'actions', summary['actionCounts'])
print('gen stats', json.dumps(summary['gen'])[:600])
