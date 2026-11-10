p='soak.mjs'
s=open(p).read()
a=s.index("const { browser, page } = await launchRaw();")
b=s.index("const ev = (fn, a) => page.evaluate(fn, a);")
block=s[a:b]
block=block.replace("const { browser, page } = await launchRaw();","let browser, page;")
# wrap listener registrations into attach()
lines=block.split('\n')
new=[]
inside=[]
for ln in lines:
    new.append(ln)
block='\n'.join(new)
block=block.replace("page.on('pageerror'","function attach() {\npage.on('pageerror'",1)
block=block.replace("let saves = 0, saveBytes = 0;","}\nlet saves = 0, saveBytes = 0;",1)
block=block.replace("page.on('response', res => { if (res.status() >= 400 && failedRequests.length < 200) failedRequests.push({ step, status: res.status(), url: res.url().slice(0, 200) }); });","async function openBrowser() {\n    ({ browser, page } = await launchRaw());\n    attach();\n    page.on('response', res => { if (res.status() >= 400 && failedRequests.length < 200) failedRequests.push({ step, status: res.status(), url: res.url().slice(0, 200) }); });\n}\nawait openBrowser();")
s=s[:a]+block+s[b:]
# reload: relaunch the browser when the page cannot be reloaded
old="""async function reload() {
    await page.reload({ waitUntil: 'domcontentloaded' });"""
new2="""async function reload() {
    try { await page.reload({ waitUntil: 'domcontentloaded' }); } catch (error) {
        log(`reload failed (${error.message}); relaunching the browser`);
        try { await browser.close(); } catch { /* gone */ }
        await openBrowser();
        relaunches += 1;
        await page.goto(ST_URL);
    }"""
assert old in s; s=s.replace(old,new2)
s=s.replace("let replies = Number(args.replies0 ?? 0), stuck = 0,","let relaunches = 0;\nlet replies = Number(args.replies0 ?? 0), stuck = 0,")
s=s.replace("JSON.stringify({ step, replies, stuck, stuckReloads, driverErrors, heldBack,","JSON.stringify({ step, replies, stuck, stuckReloads, driverErrors, heldBack, relaunches,")
open(p,'w').write(s)
p='cdp-page.mjs'
s=open(p).read()
s=s.replace("""        async goto(url) { lastUrl = url; const done = waitEvent('Page.domContentEventFired'); await send('Page.navigate', { url }); await done; },""","""        async goto(url) { lastUrl = url; const done = waitEvent('Page.domContentEventFired'); done.catch(() => {}); await send('Page.navigate', { url }); await done; },""")
s=s.replace("""            const done = waitEvent('Page.domContentEventFired');
            if (crashed)""","""            const done = waitEvent('Page.domContentEventFired');
            done.catch(() => {});
            if (crashed)""")
open(p,'w').write(s)
