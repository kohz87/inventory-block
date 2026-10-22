// The harness mock, routed: queued files named cls-*, ext-*, nsd-* answer the preroll classifier, the
// extractor and NPC State Delta's scanner; other files answer the main reply (as harness/mock/queue.mjs).
import http from 'node:http';
import fs from 'node:fs';
const [Q, LOG, PORT] = process.argv.slice(2);
let n = 0;
const kindOf = body => {
    if (/You sort one message a reader wrote/.test(body)) return 'cls';
    if (/You read one reply from an interactive story and list what changed/.test(body)) return 'ext';
    if (/dossier scanner/.test(body)) return 'nsd';
    return 'main';
};
http.createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
        if (req.url.endsWith('/models')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ object: 'list', data: [{ id: 'mock-model', object: 'model' }] })); return; }
        if (!req.url.endsWith('/chat/completions')) { res.writeHead(404); res.end(); return; }
        n += 1;
        fs.writeFileSync(`${LOG}/req-${n}.json`, body);
        const kind = kindOf(body);
        const files = fs.readdirSync(Q).sort().filter(f => (kind === 'main' ? !/^(cls|ext|nsd)-/.test(f) : f.startsWith(`${kind}-`)));
        let reply = '';
        let status = 200;
        if (files.length) {
            reply = fs.readFileSync(`${Q}/${files[0]}`, 'utf8'); fs.unlinkSync(`${Q}/${files[0]}`);
            const m = reply.match(/^@@status (\d+)\n/); if (m) { status = Number(m[1]); reply = reply.slice(m[0].length); }
        }
        fs.appendFileSync(`${LOG}/served.txt`, `${n} main=${kind === 'main'} kind=${kind} len=${reply.length} status=${status}\n`);
        if (status !== 200) { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: { message: reply || 'mock failure' } })); return; }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'x', object: 'chat.completion', model: 'mock-model', choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }] }));
    });
}).listen(Number(PORT), '127.0.0.1');
