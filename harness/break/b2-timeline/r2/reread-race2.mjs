const { createHost } = await import('/home/user/_break/b2-timeline-r2/Story_block/testkit/index.js');
const { readRecord } = await import('/home/user/_break/b2-timeline-r2/Story_block/src/v2/persist.js');
console.warn = () => {};
const R = (t, l) => `${t}\n<Changes>\n${l.join('\n')}\n</Changes>`;
const h = await createHost();
await h.send('a', R('Ann comes.', ['+ present Ann']));
await h.send('b', R('Bo comes.', ['+ present Bo']));
await h.send('c', R('Cy comes.', ['+ present Cy']));
h.ctx.chat[4].mes = R('Dee comes.', ['+ present Dee']);      // the reader corrects reply 4 and presses Re-read
const p = h.sdk.reread(4);
h.ctx.chat.splice(1, 2);                                        // ...and deletes the first exchange right away
await h.st.eventSource.emit('message_deleted', h.ctx.chat.length);
const r = await p;
console.log('reread', JSON.stringify(r?.ok), r?.code ?? '', (r?.message ?? '').slice(0, 100));
console.log('present', JSON.stringify(h.head().domains.scene.present));
h.ctx.chat.forEach((m, i) => { const rec = readRecord(m); if (rec) console.log(i, JSON.stringify(m.mes.slice(0, 12)), rec.receipts.map(x => x.summary).join(' | ')); });
