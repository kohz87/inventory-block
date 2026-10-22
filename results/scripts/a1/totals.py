import json, sys, collections
for name in sys.argv[1:]:
    seeds=steps=reps=sigs=crash=nskips=0; inv=collections.Counter(); k=collections.Counter()
    try: lines=open(name).read().splitlines()
    except FileNotFoundError: continue
    for l in lines:
        d=json.loads(l); seeds+=1
        if d.get('crash'): crash+=1; continue
        steps+=d.get('steps',0); reps+=d.get('replies',0); nskips+=d.get('nskips',0)
        for s in d.get('sigs',[]): sigs+=1; inv[s.get('inv')]+=1
        for e in d.get('kinds','').split():
            a,b=e.rsplit(':',1); k[a]+=int(b)
    print(f"{name}: seeds {seeds} steps {steps} replies {reps} signals {sigs} {dict(inv)} crashes {crash} non-dependent skips {nskips}")
    print('  final-chat receipts:', {x:k[x] for x in ['capture.coin','capture.xp','party.recover','capture.time','capture.encounter','combat.start','combat.act','capture.present','time.settle','chronicle.digest']})
