import json, os
out='/home/user/cell/a1/out'; sc=out+'/scripts'
def tot(name):
    p=f'{sc}/{name}'
    if not os.path.exists(p): return None
    r=dict(seeds=0, full=0, steps=0, replies=0, signals=0, inv={}, crashes=0, skips=0, skipex=[])
    for l in open(p):
        d=json.loads(l); r['seeds']+=1
        if d.get('crash'): r['crashes']+=1; continue
        r['steps']+=d.get('steps',0); r['replies']+=d.get('replies',0); r['skips']+=d.get('nskips',0)
        if d.get('skips'): r['skipex'].extend(d['skips'][:1])
        if d.get('steps',0)>=300: r['full']+=1
        for s in d.get('sigs',[]): r['signals']+=1; r['inv'][s.get('inv')]=r['inv'].get(s.get('inv'),0)+1
    return r
a=tot('fz.jsonl'); b=tot('fz2.jsonl')
rr=[json.loads(l) for l in open(f'{sc}/rr.jsonl')] if os.path.exists(f'{sc}/rr.jsonl') else []
print(json.dumps(dict(fz=a, fz2=b, rr=dict(seeds=len(rr), diffs=sum(x['nsigs'] for x in rr), known={k: sum(1 for x in rr for s in x['sigs'] if s.get('known')==k) for k in ['B-a1-3','B-a1-10?','B-a1-11','B-a1-12?',None]})), indent=1)[:3000])
