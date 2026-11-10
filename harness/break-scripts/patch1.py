p='soak.mjs'
s=open(p).read()
old="""        await page.screenshot({ path: `${RUN}/snap/stuck-${step}.png` });"""
new="""        await page.screenshot({ path: `${RUN}/snap/stuck-${step}.png` });
        if (!state.gen && (await ev(() => Boolean(SillyTavern.getContext().chat.at(-1)?.is_user)))) {
            // Held back (canGenerate), e.g. "You died. Return in time, or swipe/delete back.": the reader
            // deletes back past the reply that holds the fatal fight.
            const why = await ev(() => [...document.querySelectorAll('.story-suite-notice-text')].map(n => n.textContent).join(' | '));
            await ev(async () => {
                const c = SillyTavern.getContext();
                while (c.chat.length > 1 && c.chat.at(-1).is_user) await c.executeSlashCommandsWithOptions('/del 1');
                if (c.chat.length > 2) await c.executeSlashCommandsWithOptions('/del 1');
            });
            await page.waitForTimeout(800);
            heldBack += 1;
            log(`  held back at step ${step} (${why || 'no notice text'}); deleted back to message ${await ev(() => SillyTavern.getContext().chat.length)}`);
        }"""
assert old in s
s=s.replace(old,new)
s=s.replace("let replies = 0, stuck = 0, stuckReloads = 0, driverErrors = 0;","let replies = 0, stuck = 0, stuckReloads = 0, driverErrors = 0, heldBack = 0;")
s=s.replace("JSON.stringify({ step, replies, stuck, stuckReloads, driverErrors,","JSON.stringify({ step, replies, stuck, stuckReloads, driverErrors, heldBack,")
s=s.replace("if (driverErrors > 60) break;","if (driverErrors > 60 || /browser has been closed/.test(e.message)) break;")
open(p,'w').write(s)
