p='soak.mjs'
s=open(p).read()
old="page.on('request', req => { if (req.url().includes('/api/chats/save')) { saves += 1; saveBytes += (req.postData() ?? '').length; } });"
assert old in s
s=s.replace(old,"// Saves are counted in the page (a fetch wrapper): Playwright keeps request bodies alive, and a\n// 15 MB chat saved 5 times a reply ran the driver out of memory.\nconst pageSaves = () => ev(() => [window.__soak?.saves ?? 0, window.__soak?.saveBytes ?? 0]).catch(() => [0, 0]);")
old2="""        const s = window.__soak = { installed: true, turns: [], intercept: [], recvAt: null };"""
new2="""        const s = window.__soak = { installed: true, turns: [], intercept: [], recvAt: null, saves: 0, saveBytes: 0 };
        const realFetch = window.fetch;
        window.fetch = function (input, init) {
            try {
                const url = typeof input === 'string' ? input : input?.url ?? '';
                if (url.includes('/api/chats/save')) { s.saves += 1; s.saveBytes += typeof init?.body === 'string' ? init.body.length : 0; }
            } catch { /* counting only */ }
            return realFetch.apply(this, arguments);
        };"""
assert old2 in s; s=s.replace(old2,new2)
old3="    const savesBefore = saves, bytesBefore = saveBytes, errBefore = consoleErr"
assert old3 in s
s=s.replace(old3,"    const [savesBefore, bytesBefore] = await pageSaves();\n    const errBefore = consoleErr")
old4="        saves: saves - savesBefore, save_bytes: saveBytes - bytesBefore,"
assert old4 in s
s=s.replace(old4,"        saves: savesNow - savesBefore, save_bytes: bytesNow - bytesBefore,")
old5="    let fileBytes = '';"
s=s.replace(old5,"    const [savesNow, bytesNow] = await pageSaves();\n    let fileBytes = '';",1)
open(p,'w').write(s)
