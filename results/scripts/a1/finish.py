# Appends "What held up" + fuzz totals + scripts list to REPORT.md (run once at the end).
import json, subprocess, os
out='/home/user/cell/a1/out'; sc=out+'/scripts'
def tot(name):
    p=f'{sc}/{name}'
    if not os.path.exists(p): return None
    seeds=steps=reps=sigs=crash=nskips=0; inv={}; full=0
    for l in open(p):
        d=json.loads(l); seeds+=1
        if d.get('crash'): crash+=1; continue
        steps+=d.get('steps',0); reps+=d.get('replies',0); nskips+=d.get('nskips',0)
        if d.get('steps',0)>=300: full+=1
        for s in d.get('sigs',[]): sigs+=1; inv[s.get('inv')]=inv.get(s.get('inv'),0)+1
    return dict(seeds=seeds, full=full, steps=steps, replies=reps, signals=sigs, inv=inv, crashes=crash, skips=nskips)
print(json.dumps({n: tot(n) for n in ['fz.jsonl','fz2.jsonl']}, indent=1))
