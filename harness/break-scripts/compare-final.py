# Old soak (older v2, 1,202 replies) vs the final soak, two comparable windows: python3 compare-final.py <out.png>
import sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
OLD, NEW = '#2a78d6', '#eb6834'
INK, INK2, SURF, GRID = '#0b0b0b', '#52514e', '#fcfcfb', '#e4e3df'
plt.rcParams.update({'figure.facecolor': SURF, 'axes.facecolor': SURF, 'axes.edgecolor': GRID, 'axes.labelcolor': INK2, 'xtick.color': INK2, 'ytick.color': INK2,
                     'axes.grid': True, 'axes.grid.axis': 'y', 'grid.color': GRID, 'grid.linewidth': 0.6, 'axes.spines.top': False, 'axes.spines.right': False,
                     'font.size': 9, 'axes.titlesize': 10, 'axes.titlecolor': INK, 'legend.frameon': False})
M = [  # metric, unit, old (1–250, 1001–1202), new (1–250, 1001–1250)
    ('Capture, median', 'ms', (717, 5558), (276, 3596)),
    ('Prompt build, median', 'ms', (375, 4349), (251, 3033)),
    ('Send → request, median', 'ms', (1337, 8456), (742, 4131)),
    ('Uploaded per send, median', 'MB', (8.6, 273), (3.93, 35.03)),
    ('Chat file at window end', 'MB', (7.2, 74.8), (2.37, 10.89)),
    ('Saves per send', '', (4.26, 4.12), (4.15, 3.76)),
]
fig, axes = plt.subplots(2, 3, figsize=(11, 6))
for ax, (title, unit, old, new) in zip(axes.flat, M):
    x = [0, 1]; w = 0.36
    b1 = ax.bar([i - w / 2 - 0.01 for i in x], old, w, color=OLD, label='earlier soak (older v2)')
    b2 = ax.bar([i + w / 2 + 0.01 for i in x], new, w, color=NEW, label='final soak (all beta merged)')
    for bars in (b1, b2):
        for b in bars: ax.annotate(f'{b.get_height():,.4g}', (b.get_x() + b.get_width() / 2, b.get_height()), ha='center', va='bottom', fontsize=8, color=INK2, xytext=(0, 2), textcoords='offset points')
    ax.set_xticks(x, ['replies 1–250', 'replies 1001–1202/1250'])
    ax.set_title(f'{title}{f", {unit}" if unit else ""}', loc='left')
    ax.margins(y=0.15)
axes.flat[0].legend(loc='upper left')
fig.suptitle('Story Suite v2 beta soak: earlier soak vs final soak, same windows', x=0.01, ha='left', color=INK)
fig.tight_layout(); fig.savefig(sys.argv[1], dpi=130)
