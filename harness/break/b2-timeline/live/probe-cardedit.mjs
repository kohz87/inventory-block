// A character made on the greeting (before the first reply), then the character card is edited.
import { launch, openPage, openNarrator, chatId, pageHead, fileChat, headOf, sleep, J } from './lib.mjs';
const browser = await launch();
const page = await openPage(browser, {});
await openNarrator(page);
const id = await chatId(page);
await page.evaluate(() => StoryBlock.sdk.command('party.create', { name: 'Ren', preset: 'fighter' }));
await page.evaluate(() => StoryBlock.sdk.command('scene.present', { add: 'Ann' }));
await sleep(1500);
const show = async l => { const h = headOf(fileChat(id)); console.log(l, 'file pc', !!h?.domains?.party?.pc, 'present', J(h?.domains?.scene?.present), '| live pc', !!(await pageHead(page))?.domains?.party?.pc); };
await show('before the card edit');
// the reader opens the character card and adds a word to the description (SillyTavern saves the card)
await page.evaluate(async () => { const $ = window.jQuery; $('#rm_button_selected_ch').trigger('click'); await new Promise(r => setTimeout(r, 800)); const t = $('#description_textarea'); t.val(`${t.val()} Tall.`).trigger('input'); await new Promise(r => setTimeout(r, 3000)); });
await sleep(2000);
await show('after the card edit');
// put the card back
await page.evaluate(async () => { const $ = window.jQuery; const t = $('#description_textarea'); t.val(t.val().replace(/ Tall\.$/, '')).trigger('input'); await new Promise(r => setTimeout(r, 3000)); });
await browser.close();
