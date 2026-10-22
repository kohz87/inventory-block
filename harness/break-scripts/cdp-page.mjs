// A small Playwright-like page over raw CDP (Chromium's DevTools protocol through Node's WebSocket).
// Why: Playwright keeps every request object of a page alive until it navigates, bodies included;
// SillyTavern saves the whole chat (15+ MB) several times a reply, so a long soak ran the driver out
// of memory. Here no Network domain is enabled and nothing is kept.
// Supports what soak.mjs uses: goto, reload, evaluate, waitForFunction, waitForTimeout, fill, click,
// keyboard.press, screenshot, on('console' | 'pageerror' | 'response').
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launchRaw({ width = 1440, height = 900, port = 9451, mobile = false, scale = 1 } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'beta-e2e-chrome-'));
    const proc = spawn('/opt/pw-browsers/chromium', [
        '--headless=new', '--no-sandbox', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-proxy-server', '--no-first-run',
        '--no-default-browser-check', '--disable-gpu', '--enable-precise-memory-info', '--js-flags=--expose-gc',
        '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
        `--window-size=${width},${height}`, 'about:blank',
    ], { stdio: 'ignore' });
    let info = null;
    for (let i = 0; i < 100 && !info; i += 1) {
        try { info = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { await sleep(200); }
    }
    const target = info.find(t => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let id = 0;
    let lastUrl = 'about:blank';
    const pending = new Map();
    const listeners = new Map();
    const emit = (name, value) => { for (const fn of listeners.get(name) ?? []) { try { fn(value); } catch { /* listener */ } } };
    const waiters = new Set();
    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
            return;
        }
        for (const w of [...waiters]) if (w.method === msg.method) { waiters.delete(w); w.resolve(msg.params); }
        if (msg.method === 'Inspector.targetCrashed') emit('__crash', true);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const type = msg.params.type === 'warning' ? 'warning' : msg.params.type;
            const text = (msg.params.args ?? []).map(a => a.value ?? a.description ?? a.unserializableValue ?? '').join(' ');
            const url = msg.params.stackTrace?.callFrames?.[0]?.url ?? '';
            emit('console', { type: () => type, text: () => text, location: () => ({ url }) });
        } else if (msg.method === 'Log.entryAdded') {
            const e = msg.params.entry;
            const type = e.level === 'warning' ? 'warning' : e.level;
            emit('console', { type: () => type, text: () => `${e.text}${e.url ? ` ${e.url}` : ''}`, location: () => ({ url: e.url ?? '' }) });
            const status = /status of (\d{3})/.exec(e.text)?.[1];
            if (status) emit('response', { status: () => Number(status), url: () => e.url ?? '' });
        } else if (msg.method === 'Runtime.exceptionThrown') {
            const d = msg.params.exceptionDetails;
            const message = d.exception?.description ?? d.text ?? 'exception';
            emit('pageerror', { message, stack: message });
        }
    };
    let crashed = false;
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
    }
    const waitEvent = (method, ms = 120000) => new Promise((resolve, reject) => {
        const w = { method, resolve };
        waiters.add(w);
        setTimeout(() => { if (waiters.delete(w)) reject(new Error(`timeout waiting for ${method}`)); }, ms);
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Inspector.enable').catch(() => {});
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true }).catch(() => {});
    // window.prompt/alert/confirm would block Runtime.evaluate: accept them at once.
    ws.addEventListener('message', ev => { try { const m = JSON.parse(ev.data); if (m.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true, promptText: globalThis.__promptText ?? '' }).catch(() => {}); } catch { /* ignore */ } });

    async function evaluate(fn, arg) {
        const expression = `(${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)})`;
        const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
        if (r.exceptionDetails) throw new Error(`page.evaluate: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
        return r.result.value;
    }
    const page = {
        on(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
        evaluate,
        async goto(url) { lastUrl = url; const done = waitEvent('Page.domContentEventFired'); done.catch(() => {}); await send('Page.navigate', { url }); await done; },
        async reload() {
            const done = waitEvent('Page.domContentEventFired');
            done.catch(() => {});
            if (crashed) { crashed = false; await send('Page.navigate', { url: lastUrl }); } else await send('Page.reload', { ignoreCache: false });
            await done;
        },
        crashed: () => crashed,
        waitForTimeout: ms => sleep(ms),
        async waitForFunction(fn, arg, { timeout = 30000 } = {}) {
            const t0 = Date.now();
            for (;;) {
                let ok = false;
                try { ok = await evaluate(fn, arg ?? undefined); } catch { ok = false; }
                if (ok) return true;
                if (Date.now() - t0 > timeout) throw new Error(`waitForFunction timed out after ${timeout} ms`);
                await sleep(200);
            }
        },
        async fill(selector, text) {
            await evaluate(([s, t]) => { const el = document.querySelector(s); el.focus(); el.value = t; el.dispatchEvent(new Event('input', { bubbles: true })); }, [selector, text]);
        },
        async click(selector, { timeout = 30000 } = {}) {
            const t0 = Date.now();
            for (;;) {
                const done = await evaluate(s => {
                    const el = document.querySelector(s);
                    if (!el) return false;
                    const style = getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null) return false;
                    el.click();
                    return true;
                }, selector);
                if (done) return;
                if (Date.now() - t0 > timeout) throw new Error(`page.click: Timeout ${timeout}ms exceeded (${selector} not visible)`);
                await sleep(100);
            }
        },
        keyboard: {
            async press(combo) {
                const parts = combo.split('+');
                const key = parts.pop();
                const modifiers = (parts.includes('Alt') ? 1 : 0) | (parts.includes('Control') ? 2 : 0) | (parts.includes('Shift') ? 8 : 0);
                const code = key;
                const k = key.startsWith('Key') ? key.slice(3).toLowerCase() : key;
                const vk = key.startsWith('Key') ? key.charCodeAt(3) : key === 'Escape' ? 27 : 0;
                await send('Input.dispatchKeyEvent', { type: 'keyDown', modifiers, key: k, code, windowsVirtualKeyCode: vk });
                await send('Input.dispatchKeyEvent', { type: 'keyUp', modifiers, key: k, code, windowsVirtualKeyCode: vk });
            },
        },
        // A file chooser the UI opens (e.g. the Packs panel's hidden <input type=file>), filled like a reader would.
        async setInputFiles(selector, files) {
            const { root } = await send('DOM.getDocument', { depth: -1, pierce: true });
            const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
            if (!nodeId) throw new Error(`setInputFiles: ${selector} not found`);
            await send('DOM.setFileInputFiles', { nodeId, files: [].concat(files) });
        },
        async screenshot({ path: file }) {
            const r = await send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
        },
        context: () => ({}),
        // Raw protocol access (profiling).
        cdp: (method, params, ms) => send(method, params, ms),
    };
    const browser = {
        async close() { try { ws.close(); } catch { /* closing */ } proc.kill('SIGKILL'); proc.unref(); await sleep(500); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* temp */ } },
    };
    return { browser, page };
}
