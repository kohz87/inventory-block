process.env.B2ROOT='/home/user/_break/b2-timeline-r2';
const { allHost } = await import('../lib/host.mjs');
console.warn=()=>{};
const h = await allHost();
console.log('create', (await h.sdk.command('party.create', { name: 'Ren', preset: 'fighter' })).ok);
await h.send('a','x\n<Changes>\n+ item Rope\n+ coin 9\n</Changes>');
const st=Object.values(h.head().domains.inventory.stacks)[0];
for (const [t,p] of [['wallet.receive',{owner:'party',amount:1}],['wallet.pay',{owner:'party',amount:1}],['inventory.drop',{stack:st.id,qty:1}],['scene.present',{add:'Ann'}],['scene.place',{name:'X',kind:'settlement'}],['inventory.give',{stack:st.id}]]) { const r=await h.sdk.command(t,p); console.log(t, r.ok, r.code, r.message?.slice(0,80)); }
