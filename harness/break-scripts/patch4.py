p='soak.mjs'
s=open(p).read()
old="""        if (!gen && Date.now() - t0 > 6000 && fs.readdirSync(MOCK_Q).length > 0) return false;"""
new="""        if (!gen && Date.now() - t0 > 6000 && fs.readdirSync(MOCK_Q).length > 0
            && await ev(() => document.querySelector('#story_suite_v2_bar .story-suite-notice')?.hidden === false && SillyTavern.getContext().chat.at(-1)?.is_user)) return false;"""
assert old in s; s=s.replace(old,new)
s=s.replace("async function waitTurn(before, ms = 30000) {","async function waitTurn(before, ms = 90000) {")
open(p,'w').write(s)
