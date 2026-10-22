p='soak.mjs'
s=open(p).read()
old="""        if (fight && offers.length) {
            const start = await cmd('combat.start', { offer: offers[0].id });"""
new="""        // A reader does not walk into a fight to the death; those offers are turned down.
        for (const o of offers.filter(o => o.stakes === 'death').slice(0, 2)) await cmd('combat.dismiss', { offer: o.id });
        const fair = offers.filter(o => o.stakes !== 'death');
        if (fight && fair.length) {
            const start = await cmd('combat.start', { offer: fair[0].id });"""
assert old in s; s=s.replace(old,new)
s=s.replace("} else if (offers.length > 2) await cmd('combat.dismiss', { offer: offers[0].id });","} else if (fair.length > 2) await cmd('combat.dismiss', { offer: fair[0].id });")
old2="""        if (n > before && !gen) return true;"""
new2="""        if (n > before && !gen) return true;
        // Held back before any request (canGenerate): the queued reply is still there and nothing runs.
        if (!gen && Date.now() - t0 > 6000 && fs.readdirSync(MOCK_Q).length > 0) return false;"""
assert old2 in s; s=s.replace(old2,new2)
open(p,'w').write(s)
