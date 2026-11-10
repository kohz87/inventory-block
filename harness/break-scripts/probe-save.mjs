// Times one chat save in the soak's live page (attaches to its Chrome on 9382 over CDP).
const list = await (await fetch('http://127.0.0.1:9382/json/list')).json();
const t = list.find(x => x.type === 'page' && x.url.includes('8182'));
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params) => new Promise(r => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const expr = `(async () => {
  const c = SillyTavern.getContext();
  const t0 = performance.now(); const s = JSON.stringify(c.chat); const t1 = performance.now();
  const r = await fetch('/api/chats/save', { method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ ch_name: 'probe', file_name: 'b6-probe-save', chat: [{ user_name: 'x', character_name: 'probe', chat_metadata: {} }, ...c.chat], avatar_url: c.characters[c.characterId]?.avatar, force: true }) });
  const t2 = performance.now();
  return { chars: s.length, stringifyMs: Math.round(t1 - t0), saveRoundTripMs: Math.round(t2 - t1), status: r.status };
})()`;
const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r));
ws.close(); process.exit(0);
