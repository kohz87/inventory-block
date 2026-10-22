p='soak.mjs'
s=open(p).read()
# resume support
s=s.replace("for (const f of fs.readdirSync(MOCK_LOG)) fs.rmSync(`${MOCK_LOG}/${f}`, { recursive: true, force: true });",
"const RESUME = typeof args.resume === 'string' ? args.resume : null;\nconst SEG = args.segment ?? 'a';\nif (!RESUME) for (const f of fs.readdirSync(MOCK_LOG)) fs.rmSync(`${MOCK_LOG}/${f}`, { recursive: true, force: true });")
old_chat=s[s.index("const chatId = await ev(async CHAR_NAME => {"):s.index("const chatFile = ")]
new_chat="""let chatId;
if (RESUME) {
    chatId = RESUME;
    await ev(async ({ chatId, CHAR_NAME }) => {
        const ctx = SillyTavern.getContext();
        await ctx.executeSlashCommandsWithOptions('/persona-set mode=temp Wessel');
        await ctx.selectCharacterById(String(ctx.characters.findIndex(c => c.name === CHAR_NAME)));
        await new Promise(r => setTimeout(r, 1000));
        await ctx.openCharacterChat(chatId);
        await new Promise(r => setTimeout(r, 2000));
    }, { chatId, CHAR_NAME });
    log('resumed chat', chatId, 'now', await ev(() => SillyTavern.getContext().getCurrentChatId()), 'messages', await ev(() => SillyTavern.getContext().chat.length));
} else {
""" + old_chat.replace("const chatId = await ev(", "chatId = await ev(").replace("\n", "\n    ").rstrip() + "\n}\n"
s=s.replace(old_chat,new_chat)
# counters from previous segment
s=s.replace("let replies = 0, stuck = 0, stuckReloads = 0, driverErrors = 0, heldBack = 0;",
"let replies = Number(args.replies0 ?? 0), stuck = 0, stuckReloads = 0, driverErrors = 0, heldBack = 0;")
s=s.replace("let step = 0;","let step = Number(args.step0 ?? 0);")
s=s.replace("const csv = fs.createWriteStream(`${RUN}/metrics.csv`);","const csv = fs.createWriteStream(`${RUN}/metrics.csv`, { flags: RESUME ? 'a' : 'w' });")
s=s.replace("csv.write(`${COLS.join(',')}\\n`);","if (!RESUME) csv.write(`${COLS.join(',')}\\n`);")
s=s.replace("let lastReload = 0;","let lastReload = replies;")
s=s.replace("`${RUN}/summary.json`","`${RUN}/summary-${SEG}.json`").replace("`${RUN}/console-samples.json`","`${RUN}/console-samples-${SEG}.json`")
# reconnect after reload
s=s.replace("""async function reload() {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitHost(page);
    await instrument();""","""async function reload() {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitHost(page);
    await instrument();
    await connectMock(page);""")
open(p,'w').write(s)
