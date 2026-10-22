import { open } from './demo-common.mjs';
const h = await open({ width: 1440, height: 1000 });
const { ev } = h;
await h.openNarrator('The Narrator - 2026-10-18@09h00m00s000ms');
const rows = await ev(() => {
  const chat = SillyTavern.getContext().chat;
  const out = [];
  chat.forEach((m, i) => {
    const d = (m.mes.match(/<Director>([\s\S]*?)<\/Director>/) ?? [])[1] ?? '';
    for (const line of d.split('\n')) if (/Sheepfold Wolves|Sheepfold Bounty|The bond/.test(line) && /^[+~!-]/.test(line.trim())) {
      let u = ''; for (let j = i - 1; j >= 0 && !(!chat[j].is_user && !chat[j].is_system); j--) if (chat[j].is_user) u = chat[j].mes;
      out.push(`${i}: ${line.trim().slice(0, 90)}  <= user: ${u.slice(0, 60)}`);
    }
  });
  return out;
});
console.log(rows.join('\n'));
await h.browser.close();
