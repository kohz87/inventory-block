p='cdp-page.mjs'
s=open(p).read()
old="""    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const n = ++id;
        pending.set(n, { resolve, reject });
        ws.send(JSON.stringify({ id: n, method, params }));
    });"""
new="""    let crashed = false;
    // Every call times out: a renderer killed (OOM) or wedged must not hang the driver forever.
    const send = (method, params = {}, ms = 180000) => new Promise((resolve, reject) => {
        if (crashed && method === 'Runtime.evaluate') { reject(new Error('page.evaluate: Target page crashed')); return; }
        const n = ++id;
        const timer = setTimeout(() => { if (pending.delete(n)) reject(new Error(`CDP ${method} timed out after ${ms} ms`)); }, ms);
        pending.set(n, { resolve: v => { clearTimeout(timer); resolve(v); }, reject: e => { clearTimeout(timer); reject(e); } });
        ws.send(JSON.stringify({ id: n, method, params }));
    });
    page_crash: {
        listeners.set('__crash', [() => { crashed = true; }]);
    }"""
assert old in s; s=s.replace(old,new)
old2="""        for (const w of [...waiters]) if (w.method === msg.method) { waiters.delete(w); w.resolve(msg.params); }"""
new2="""        for (const w of [...waiters]) if (w.method === msg.method) { waiters.delete(w); w.resolve(msg.params); }
        if (msg.method === 'Inspector.targetCrashed') emit('__crash', true);"""
assert old2 in s; s=s.replace(old2,new2)
old3="""        async reload() { const done = waitEvent('Page.domContentEventFired'); await send('Page.reload', { ignoreCache: false }); await done; },"""
new3="""        async reload() {
            const done = waitEvent('Page.domContentEventFired');
            if (crashed) { crashed = false; await send('Page.navigate', { url: lastUrl }); } else await send('Page.reload', { ignoreCache: false });
            await done;
        },
        crashed: () => crashed,"""
assert old3 in s; s=s.replace(old3,new3)
s=s.replace("async goto(url) { const done","async goto(url) { lastUrl = url; const done")
s=s.replace("    let id = 0;\n","    let id = 0;\n    let lastUrl = 'about:blank';\n",1)
s=s.replace("    await send('Log.enable');","    await send('Log.enable');\n    await send('Inspector.enable').catch(() => {});")
open(p,'w').write(s)
