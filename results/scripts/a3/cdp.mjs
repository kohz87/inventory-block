// attach to the persistent chromium (port 9463), minimal page API
import fs from 'node:fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function attach({ port = 9463, width, height, mobile } = {}) {
  const info = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = info.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; } for (const l of listeners) l(m); };
  const send = (method, params = {}, ms = 120000) => new Promise((res, rej) => { const n = ++id; const t = setTimeout(() => { pending.delete(n); rej(new Error('timeout ' + method)); }, ms); pending.set(n, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } }); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  if (width) await send('Emulation.setDeviceMetricsOverride', { width, height: height ?? 900, deviceScaleFactor: 1, mobile: !!mobile });
  const evaluate = async (fn, arg) => { const expression = typeof fn === 'string' ? fn : `(${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)})`; const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.exceptionDetails) throw new Error('evaluate: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)); return r.result.value; };
  const waitEvent = (method, ms = 60000) => new Promise((res, rej) => { const l = m => { if (m.method === method) { listeners.splice(listeners.indexOf(l), 1); res(m.params); } }; listeners.push(l); setTimeout(() => rej(new Error('timeout ' + method)), ms); });
  return {
    send, evaluate, on: fn => listeners.push(fn), sleep,
    async goto(url) { const d = waitEvent('Page.loadEventFired'); await send('Page.navigate', { url }); await d.catch(() => {}); },
    async reload() { const d = waitEvent('Page.loadEventFired'); await send('Page.reload', {}); await d.catch(() => {}); },
    async waitFor(fn, arg, timeout = 30000) { const t0 = Date.now(); for (;;) { let ok = false; try { ok = await evaluate(fn, arg); } catch {} if (ok) return true; if (Date.now() - t0 > timeout) return false; await sleep(250); } },
    async shot(file, quality = 50) { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    async setSize(width, height = 900, mobile = false) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile }); await send('Emulation.setTouchEmulationEnabled', { enabled: mobile }).catch(() => {}); },
    close() { ws.close(); },
  };
}
