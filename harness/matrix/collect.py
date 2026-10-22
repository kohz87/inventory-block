#!/usr/bin/env python3
# Collects one matrix pass from $SP/beta-e2e/scenario/p<N>-<cell>/ into results/:
#   results/matrix.md (cell x row for the newest pass, plus every pass's counts), results/history.json,
#   results/runs/p<N>-<cell>.md (the run's result table, heads, checks), results/shots/<cell>/ (newest pass, small JPEGs).
# usage: collect.py <pass number>
import json, os, re, shutil, subprocess, sys, datetime

SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad'
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RES = os.path.join(REPO, 'results')
P = int(sys.argv[1])
SCN = os.path.join(SP, 'beta-e2e', 'scenario')
CELLS = ['c1-desk', 'c1-phone', 'c2-off', 'c2-half', 'c3-gold', 'c3-x0.1', 'c3-x10', 'c4-noRB', 'c4-noSD', 'c4-noNSD', 'c4-nsdv1']
NOISE = re.compile(r'npc-state-delta-[a-z0-9]+\.json|status of 404|dossier scan failed|relationship batch failed|backfill failed|No message generated|was not used|refused|Settings not ready|swipe animation|swipe_info|Story String Validation|^\s+at ')

os.makedirs(os.path.join(RES, 'runs'), exist_ok=True)
hist_path = os.path.join(RES, 'history.json')
history = json.load(open(hist_path)) if os.path.exists(hist_path) else {}


def load(tag):
    d = os.path.join(SCN, tag)
    rows_p = os.path.join(d, 'rows.json')
    if not os.path.exists(rows_p):
        return None
    rows = json.load(open(rows_p))
    info = {'rows': {r['id']: {'status': r['status'], 'note': r['note'], 'title': r['title'], 'owner': r['owner']} for r in rows}}
    for name in ('heads.json', 'config.json', 'run.json'):
        p = os.path.join(d, name)
        if os.path.exists(p):
            try: info[name[:-5]] = json.load(open(p))
            except Exception: pass
    hp = os.path.join(d, 'static-hashes.txt')
    hashes = [l.split()[1] for l in open(hp) if l.strip()] if os.path.exists(hp) else []
    changes = sum(1 for a, b in zip(hashes, hashes[1:]) if a != b)
    info['static'] = {'requests': len(hashes), 'distinct': len(set(hashes)), 'changes': changes}
    cp = os.path.join(d, 'console.txt')
    lines = open(cp, errors='replace').read().splitlines() if os.path.exists(cp) else []
    info['console'] = {'lines': len(lines), 'unclassified': [l[:300] for l in lines if not NOISE.search(l)][:20]}
    info['rebuild'] = info['rows'].get('B20', {}).get('status', '?')
    info['finished'] = 'A12' in info['rows']
    return info


cells_now = {}
for cell in CELLS:
    tag = f'p{P}-{cell}'
    info = load(tag)
    if info is None:
        continue
    cells_now[cell] = info
    history.setdefault(str(P), {})[cell] = {
        'heads': info.get('heads'), 'counts': {s: sum(1 for r in info['rows'].values() if r['status'] == s) for s in ('PASS', 'FAIL', 'SKIP')},
        'rows': {k: v['status'] for k, v in info['rows'].items()}, 'static': info['static'], 'rebuild': info['rebuild'],
        'console_unclassified': len(info['console']['unclassified']), 'finished': info['finished'],
        'config': info.get('run'), 'at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
    }
    md = [f'# {tag}', '', f"config: `{json.dumps(info.get('run'))}`", f"heads: `{json.dumps(info.get('heads'))}`",
          f"static prompt: {info['static']['requests']} requests, {info['static']['distinct']} distinct, {info['static']['changes']} change(s)",
          f"rebuild == live (B20): {info['rebuild']}", f"console: {info['console']['lines']} lines, unclassified {len(info['console']['unclassified'])}", '']
    md += [f'    {l}' for l in info['console']['unclassified']]
    md += ['', '| row | what | owner | result | note |', '|---|---|---|---|---|']
    for rid, r in info['rows'].items():
        md.append(f"| {rid} | {r['title']} | {r['owner']} | {r['status']} | {str(r['note']).replace('|', '/')[:500]} |")
    if not info['finished']:
        md += ['', '**The run did not finish** (see the run log tail below).', '']
        op = os.path.join(SP, 'beta-e2e', f'run-{tag}.out')
        if os.path.exists(op):
            md += ['    ' + l for l in open(op, errors='replace').read().splitlines()[-15:]]
    open(os.path.join(RES, 'runs', f'{tag}.md'), 'w').write('\n'.join(md) + '\n')
    # Screenshots: newest pass per cell, small JPEGs.
    sd = os.path.join(SCN, tag, 'shots')
    if os.path.isdir(sd):
        out = os.path.join(RES, 'shots', cell)
        shutil.rmtree(out, ignore_errors=True)
        os.makedirs(out)
        for f in sorted(os.listdir(sd)):
            if f.endswith('.png'):
                subprocess.run(['convert', os.path.join(sd, f), '-resize', '560x>', '-quality', '50', os.path.join(out, f[:-4] + '.jpg')], check=False)
json.dump(history, open(hist_path, 'w'), indent=1)

# matrix.md: the newest pass with data, cell x row; then counts per pass.
passes = sorted(history, key=int)
newest = passes[-1]
cur = history[newest]
cells = [c for c in CELLS if c in cur]
row_ids = []
for c in cells:
    for rid in cur[c]['rows']:
        if rid not in row_ids: row_ids.append(rid)
order = lambda r: (0 if r.startswith('A') else 1, int(re.sub(r'\D', '', r) or 0), r)
abbrev = {'PASS': 'PASS', 'FAIL': '**FAIL**', 'SKIP': 'SKIP'}
md = ['# Story Suite v2 beta — live matrix', '',
      f'Newest pass: **{newest}** ({cur[cells[0]]["at"] if cells else "?"}). Heads: `{json.dumps(cur[cells[0]]["heads"]) if cells else "?"}`', '',
      'Cells: c1 Ersveil + every feature on (desk 1440 / phone 390) · c2 Ersveil, every feature off / seeded random half on · '
      'c3 no pack (gold defaults), money scale ×0.1 / ×10 · c4 one module missing (noRB/noSD/noNSD) / NSD v1-era settings. '
      'Per-run detail: `results/runs/p<pass>-<cell>.md`; screenshots: `results/shots/<cell>/`.', '',
      '| row | ' + ' | '.join(cells) + ' |', '|---|' + '---|' * len(cells)]
for rid in sorted(row_ids, key=order):
    md.append(f'| {rid} | ' + ' | '.join(abbrev.get(cur[c]['rows'].get(rid, ''), '—') for c in cells) + ' |')
md.append('| static prompt changes | ' + ' | '.join(str(cur[c]['static']['changes']) for c in cells) + ' |')
md.append('| console (unclassified) | ' + ' | '.join(str(cur[c]['console_unclassified']) for c in cells) + ' |')
md.append('| finished | ' + ' | '.join('yes' if cur[c]['finished'] else '**no**' for c in cells) + ' |')
md += ['', '## Every pass (PASS/FAIL/SKIP)', '', '| pass | ' + ' | '.join(CELLS) + ' | heads |', '|---|' + '---|' * (len(CELLS) + 1)]
for p in reversed(passes):
    h = history[p]
    any_cell = next(iter(h.values()))
    heads = ' '.join(f'{k[:2]}:{v}' for k, v in (any_cell.get('heads') or {}).items())
    md.append(f'| {p} | ' + ' | '.join(f"{h[c]['counts']['PASS']}/{h[c]['counts']['FAIL']}/{h[c]['counts']['SKIP']}" if c in h else '—' for c in CELLS) + f' | {heads} |')
open(os.path.join(RES, 'matrix.md'), 'w').write('\n'.join(md) + '\n')
print(f'collected pass {P}: {len(cells_now)} cells')
