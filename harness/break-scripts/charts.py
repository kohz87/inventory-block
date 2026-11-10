# Charts for the b6-soak run: python3 charts.py <run dir>  → <run dir>/../charts/*.png
import csv, json, os, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

RUN = sys.argv[1]
OUT = os.path.join(os.path.dirname(RUN.rstrip('/')), 'charts')
os.makedirs(OUT, exist_ok=True)
rows = list(csv.DictReader(open(os.path.join(RUN, 'metrics.csv'))))
S1, S2, S3, S5 = '#2a78d6', '#eb6834', '#1baf7a', '#e87ba4'
INK, INK2, SURF, GRID = '#0b0b0b', '#52514e', '#fcfcfb', '#e4e3df'
plt.rcParams.update({'figure.facecolor': SURF, 'axes.facecolor': SURF, 'axes.edgecolor': GRID, 'axes.labelcolor': INK2,
                     'xtick.color': INK2, 'ytick.color': INK2, 'axes.grid': True, 'grid.color': GRID, 'grid.linewidth': 0.6,
                     'axes.spines.top': False, 'axes.spines.right': False, 'font.size': 9, 'axes.titlesize': 10, 'axes.titlecolor': INK,
                     'legend.frameon': False})

def num(v):
    try: return float(v)
    except: return None

def series(col, only=None):
    xs, ys = [], []
    for r in rows:
        if only and r['action'] not in only: continue
        y = num(r[col]); x = num(r['replies'])
        if y is None or x is None: continue
        xs.append(x); ys.append(y)
    return xs, ys

def rolling_median(ys, w=25):
    out = []
    for i in range(len(ys)):
        win = sorted(ys[max(0, i - w + 1):i + 1]); out.append(win[len(win) // 2])
    return out

def save(fig, name):
    fig.tight_layout(); fig.savefig(os.path.join(OUT, name), dpi=130); plt.close(fig)

reload_at = [num(r['replies']) for r in rows if 'reload' in (r.get('reader_actions') or '')]
gen = ['send', 'swipe', 'regenerate']

# 1. Capture and prompt-build (interceptor) time per reply.
fig, axes = plt.subplots(2, 1, figsize=(10, 6), sharex=True)
for ax, col, title, color in [(axes[0], 'capture_ms', 'Capture time per reply (MESSAGE_RECEIVED → turn event, incl. its save), ms', S1),
                              (axes[1], 'intercept_ms', 'Prompt build per reply (Story Block interceptor: flush + cues + assemble), ms', S2)]:
    xs, ys = [], []
    for r in rows:
        if r['action'] not in gen: continue
        v = r[col].split('|')[-1] if r[col] else ''
        if num(v) is None: continue
        xs.append(num(r['replies'])); ys.append(num(v))
    ax.scatter(xs, ys, s=4, color=color, alpha=0.35, linewidths=0)
    ax.plot(xs, rolling_median(ys), color=color, lw=2, label='rolling median (25)')
    ax.set_title(title, loc='left'); ax.set_ylabel('ms'); ax.legend(loc='upper left')
axes[1].set_xlabel('replies generated')
save(fig, 'time-capture-prompt.png')

# 2. End-to-end latency.
fig, ax = plt.subplots(figsize=(10, 3.4))
xs, ys = series('latency_ms', gen)
ax.scatter(xs, ys, s=4, color=S1, alpha=0.35, linewidths=0); ax.plot(xs, rolling_median(ys), color=S1, lw=2, label='trigger → request at the model (rolling median)')
xs, ys = series('total_ms', gen)
ax.plot(xs, rolling_median(ys), color=S2, lw=2, label='trigger → capture done (rolling median)')
ax.set_yscale('log'); ax.set_title('Reply latency in SillyTavern, ms (log scale)', loc='left'); ax.set_xlabel('replies generated'); ax.legend(loc='upper left')
save(fig, 'time-latency.png')

# 3. Sizes.
fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)
xs, ys = series('chat_file_bytes'); axes[0].plot(xs, [y / 1e6 for y in ys], color=S1, lw=2)
axes[0].set_title('Chat .jsonl on disk, MB', loc='left')
xs, ys = series('storysuite_bytes'); axes[1].plot(xs, [y / 1e6 for y in ys], color=S2, lw=2)
axes[1].set_title('extra.storySuite in the chat (all messages, incl. swipe_info copies), MB', loc='left')
xs, ys = series('head_bytes'); axes[2].plot(xs, [y / 1e3 for y in ys], color=S3, lw=2)
axes[2].set_title('Head state JSON, KB', loc='left'); axes[2].set_xlabel('replies generated')
save(fig, 'size-growth.png')

# 4. Memory and DOM.
fig, axes = plt.subplots(2, 1, figsize=(10, 6), sharex=True)
xs, ys = series('heap_used'); axes[0].scatter(xs, [y / 1e6 for y in ys], s=3, color=S1, alpha=0.3, linewidths=0, label='used JS heap (each step)')
xs, ys = series('heap_after_gc'); axes[0].plot(xs, [y / 1e6 for y in ys], color=S2, lw=2, marker='o', ms=3, label='after gc() (every 25 steps)')
axes[0].set_title('Page JS heap, MB (performance.memory)', loc='left'); axes[0].legend(loc='upper left')
xs, ys = series('dom_nodes'); axes[1].plot(xs, ys, color=S1, lw=2, label='all DOM elements')
xs, ys = series('mes_nodes'); axes[1].plot(xs, [y * 100 for y in ys], color=S3, lw=1.5, label='rendered messages × 100')
xs, ys = series('ss_cards'); axes[1].plot(xs, [y * 100 for y in ys], color=S2, lw=1.5, label='.ss-card nodes × 100')
axes[1].set_title('DOM size', loc='left'); axes[1].legend(loc='upper left'); axes[1].set_xlabel('replies generated')
save(fig, 'memory-dom.png')

# 5. Saves per step.
fig, axes = plt.subplots(2, 1, figsize=(10, 6), sharex=True)
xs, ys = series('saves', ['send']); axes[0].scatter(xs, ys, s=5, color=S1, alpha=0.35, linewidths=0); axes[0].plot(xs, rolling_median(ys), color=S1, lw=2, label='send steps, rolling median')
axes[0].set_title('Chat saves (POST /api/chats/save) per send step', loc='left'); axes[0].legend(loc='upper left')
xs, ys = series('save_bytes', ['send']); axes[1].plot(xs, [y / 1e6 for y in rolling_median(ys)], color=S2, lw=2)
axes[1].set_title('Bytes uploaded by those saves per send step, MB (rolling median)', loc='left'); axes[1].set_xlabel('replies generated')
save(fig, 'saves.png')

# 6. Tail vs budget.
fig, ax = plt.subplots(figsize=(10, 3.6))
xs, ys = series('sb_tail_tokens', gen); ax.scatter(xs, ys, s=4, color=S1, alpha=0.4, linewidths=0, label='Story Suite tail, est. tokens (chars/4)')
xs, ys = series('nsd_tail_chars', gen); ax.scatter(xs, [y / 4 for y in ys], s=4, color=S2, alpha=0.4, linewidths=0, label='NSD tail (same message), est. tokens')
ax.axhline(1500, color=INK2, lw=1, ls='--'); ax.text(0, 1520, 'host tail budget 1,500', color=INK2, fontsize=8)
ax.set_title('Depth-0 tail size per request', loc='left'); ax.set_xlabel('replies generated'); ax.legend(loc='upper right')
save(fig, 'tail-budget.png')

# 7. Shared prefix with the previous request.
fig, ax = plt.subplots(figsize=(10, 3.6))
for acts, color, label in [(['send'], S1, 'send'), (['swipe', 'regenerate'], S2, 'swipe / regenerate')]:
    xs, ys = series('shared_prefix_pct', acts); ax.scatter(xs, ys, s=5, color=color, alpha=0.5, linewidths=0, label=label)
xs, ys = series('shared_prefix_pct', gen); ax.plot(xs, rolling_median(ys, 50), color=INK2, lw=1.5, label='rolling median (50)')
ax.set_ylim(0, 100); ax.set_title('Shared prefix with the previous request, % of the longer request (JSON of messages)', loc='left'); ax.set_xlabel('replies generated'); ax.legend(loc='lower left')
save(fig, 'shared-prefix.png')

# 8. Console errors / warnings, cumulative.
fig, ax = plt.subplots(figsize=(10, 3.4))
ce = cw = pe = 0; xs, e, w, p = [], [], [], []
for r in rows:
    ce += num(r['console_err']) or 0; cw += num(r['console_warn']) or 0; pe += num(r['page_errors']) or 0
    xs.append(num(r['replies'])); e.append(ce); w.append(cw); p.append(pe)
ax.plot(xs, e, color=S2, lw=2, label='console.error'); ax.plot(xs, w, color=S1, lw=2, label='console.warn'); ax.plot(xs, p, color=S5, lw=2, label='page errors')
ax.set_title('Console messages, cumulative', loc='left'); ax.set_xlabel('replies generated'); ax.legend(loc='upper left')
save(fig, 'console.png')
print('charts in', OUT)

# Prompt charts from the post-hoc request analysis (reqs.py), when present: the tail split exactly.
rp = os.path.join(RUN, 'reqs.csv')
if os.path.exists(rp):
    rq = list(csv.DictReader(open(rp)))
    def col(name, acts=None):
        xs, ys = [], []
        for r in rq:
            if acts and r['action'] not in acts: continue
            y = num(r[name]); x = num(r['replies'])
            if y is None or x is None: continue
            xs.append(x); ys.append(y)
        return xs, ys
    fig, ax = plt.subplots(figsize=(10, 3.8))
    xs, ys = col('sb_tail_tokens'); ax.scatter(xs, ys, s=4, color=S1, alpha=0.45, linewidths=0, label="Story Suite's tail (story_suite_tail_1), est. tokens")
    xs, ys = col('depth0_tokens'); ax.scatter(xs, ys, s=4, color=S2, alpha=0.35, linewidths=0, label='whole depth-0 message incl. NSD dossier + capture context')
    ax.axhline(1500, color=INK2, lw=1, ls='--'); ax.text(0, 1530, 'host tail budget 1,500 tokens', color=INK2, fontsize=8)
    ax.set_title('Tail size per story request (from the requests the model received)', loc='left'); ax.set_xlabel('replies generated'); ax.legend(loc='upper left')
    save(fig, 'tail-budget.png')
    fig, ax = plt.subplots(figsize=(10, 3.8))
    for acts, color, label in [(['send'], S1, 'send'), (['swipe', 'regenerate'], S2, 'swipe / regenerate')]:
        xs, ys = col('prefix_pct', acts); ax.scatter(xs, ys, s=6, color=color, alpha=0.55, linewidths=0, label=label)
    ax.set_ylim(0, 100); ax.set_title('Shared prefix with the previous story request, % (JSON of messages)', loc='left'); ax.set_xlabel('replies generated'); ax.legend(loc='lower left')
    save(fig, 'shared-prefix.png')
    print('prompt charts from reqs.csv')
