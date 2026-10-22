# Post-hoc prompt analysis from the mock's request log: python3 reqs.py <run dir> <mock log dir>
# For every reply row in metrics.csv: the Story Suite static part (sha, length), NSD's static rules, the
# whole system prefix, the depth-0 tail split into Story Suite's part and NSD's part, [Happened] lines,
# and the shared prefix with the previous story request. Writes <run>/reqs.csv.
import csv, hashlib, json, os, sys
RUN, LOG = sys.argv[1], sys.argv[2]
rows = list(csv.DictReader(open(os.path.join(RUN, 'metrics.csv'))))
MARK = '[Story Suite: how this story is kept]'
NSD_RULES = 'NPC STATE DELTA ONE-PASS CAPTURE.'
sha = lambda t: hashlib.sha1(t.encode()).hexdigest()[:12]
text = lambda m: m['content'] if isinstance(m['content'], str) else json.dumps(m['content'])
out = []
prev = None
for r in rows:
    if not r['req']: continue
    p = os.path.join(LOG, f"req-{r['req']}.json")
    if not os.path.exists(p): continue
    body = json.load(open(p)); msgs = body.get('messages', [])
    texts = [text(m) for m in msgs]
    st = next((t for t in texts if t.startswith(MARK)), '')
    rules = next((t for t in texts if t.startswith(NSD_RULES)), '')
    first_chat = next((i for i, m in enumerate(msgs) if m['role'] != 'system'), len(msgs))
    sysprefix = '\n\x01\n'.join(texts[:first_chat])
    last_user = max((i for i, m in enumerate(msgs) if m['role'] == 'user'), default=-1)
    tail = '\n'.join(texts[i] for i in range(last_user + 1, len(msgs)) if msgs[i]['role'] == 'system')
    cut = tail.find('NPC STATE DELTA')
    sb_tail = tail if cut < 0 else tail[:cut]
    nsd_tail = '' if cut < 0 else tail[cut:]
    happened = 0
    if sb_tail.startswith('[Happened]'):
        for line in sb_tail.split('\n')[1:]:
            if line.startswith(('Place:', 'Present:', 'Wallet:', 'Carried', 'Party:', '[Story Director', 'Routes', '[World]', 'Check waiting')): break
            happened += len(line) + 1
    whole = json.dumps(msgs)
    if prev is not None:
        n = 0; lim = min(len(prev), len(whole))
        while n < lim and prev[n] == whole[n]: n += 1
        pct = round(100 * n / max(len(prev), len(whole)), 1)
    else:
        n, pct = '', ''
    prev = whole
    out.append({'step': r['step'], 'action': r['action'], 'replies': r['replies'], 'req': r['req'], 'static_sha': sha(st), 'static_len': len(st),
                'nsd_rules_sha': sha(rules) if rules else '', 'nsd_rules_len': len(rules), 'sys_prefix_sha': sha(sysprefix), 'sys_prefix_len': len(sysprefix),
                'sb_tail_chars': len(sb_tail), 'sb_tail_tokens': -(-len(sb_tail) // 4), 'happened_chars': happened, 'nsd_tail_chars': len(nsd_tail),
                'depth0_tokens': -(-len(tail) // 4), 'prefix_chars': n, 'prefix_pct': pct, 'request_chars': len(whole), 'messages': len(msgs)})
with open(os.path.join(RUN, 'reqs.csv'), 'w', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
static = {}
for o in out: static.setdefault(o['static_sha'], []).append(int(o['step']))
print('requests', len(out))
print('SB static shas:', {k: (len(v), v[0], v[-1]) for k, v in static.items()})
rules = {}
for o in out: rules.setdefault((o['nsd_rules_sha'], o['action']), 0); rules[(o['nsd_rules_sha'], o['action'])] += 1
print('NSD rules sha by action:', rules)
over = [o for o in out if o['sb_tail_tokens'] > 1500]
print('SB tail over 1500 tokens:', len(over), [(o['step'], o['sb_tail_tokens'], o['happened_chars']) for o in over[:10]])
print('SB tail max tokens:', max(o['sb_tail_tokens'] for o in out), 'depth0 max tokens:', max(o['depth0_tokens'] for o in out), 'nsd tail max chars:', max(o['nsd_tail_chars'] for o in out))
for a in ['send', 'swipe', 'regenerate']:
    xs = sorted(o['prefix_pct'] for o in out if o['action'] == a and o['prefix_pct'] != '')
    if xs: print('prefix % median', a, xs[len(xs) // 2], 'n', len(xs))
