// Scripted OpenAI-compatible mock for the smoke test. No real model, no keys.
// Story requests (the ones carrying the reader's scripted message) get the next scripted reply; any other request
// (side calls from modules) gets an empty answer and is logged, so the run shows what modules asked for.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';

const script = JSON.parse(readFileSync(new URL('./script.json', import.meta.url), 'utf8'));
const log = process.env.MOCK_LOG ?? '/home/user/st-smoke/mock.log';
const plog = process.env.MOCK_PROMPTS ?? null;
const port = Number(process.env.MOCK_PORT ?? 5001);
const text = m => typeof m?.content === 'string' ? m.content : Array.isArray(m?.content) ? m.content.map(p => p.text ?? '').join('') : '';

function answer(messages) {
    const sys = messages.filter(m => m.role === 'system').map(text).join('\n');
    // NPC State Delta's isolated dossier scanner wants JSON: answer an empty scan (no NPC changes).
    if (/isolated dossier scanner/i.test(sys)) return { kind: 'nsd-scan', reply: JSON.stringify({ npcs: [] }) };
    const users = messages.filter(m => m.role === 'user').map(text);
    const last = users.at(-1) ?? '';
    const turn = script.turns.find(t => last.includes(t.user));
    if (turn) return { kind: 'story', reply: turn.reply };
    return { kind: 'side', reply: script.sideDefault ?? '' };
}

createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
        if (req.method === 'GET' && req.url.endsWith('/models')) {
            res.writeHead(200, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ object: 'list', data: [{ id: 'smoke-mock', object: 'model' }] }));
        }
        let parsed = {};
        try { parsed = JSON.parse(body || '{}'); } catch { /* ignore */ }
        const { kind, reply } = answer(parsed.messages ?? []);
        if (plog) appendFileSync(plog, JSON.stringify({ at: new Date().toISOString(), kind, messages: (parsed.messages ?? []).map(m => ({ role: m.role, content: text(m) })) }) + '\n');
        appendFileSync(log, JSON.stringify({ at: new Date().toISOString(), url: req.url, kind, stream: !!parsed.stream, lastUser: (parsed.messages ?? []).filter(m => m.role === 'user').map(text).at(-1)?.slice(0, 160), system: text((parsed.messages ?? [])[0]).slice(0, 160) }) + '\n');
        if (parsed.stream) {
            res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
            res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { role: 'assistant', content: reply } }] })}\n\n`);
            res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`);
            return res.end('data: [DONE]\n\n');
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'smoke', object: 'chat.completion', model: 'smoke-mock', choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }] }));
    });
}).listen(port, '127.0.0.1', () => console.log(`mock on ${port}`));
