// Shared helpers for the b6-soak live runs (SillyTavern 1.19 on 8182, mock on 5182).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';

export const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
export const OUT = `${SP}/break/b6-soak`;
export const ST_URL = 'http://127.0.0.1:8182/';
export const MOCK_URL = 'http://127.0.0.1:5182/v1';
export const MOCK_Q = `${SP}/inst/b6-soak/q`;
export const MOCK_LOG = `${SP}/inst/b6-soak/log`;
export const ST_DATA = `${SP}/inst/b6-soak/data`;
export const PACK = '/home/user/_break/b6-soak/Story_block/examples/packs/ersveil-bluewatch/pack.json';
export const CHAR_NAME = 'Ersveil';

let qn = 0;
export const queue = text => fs.writeFileSync(`${MOCK_Q}/${String(Date.now()).padStart(15, '0')}-${String(++qn).padStart(6, '0')}.txt`, text);
export const clearQueue = () => { for (const f of fs.readdirSync(MOCK_Q)) fs.unlinkSync(`${MOCK_Q}/${f}`); };
export const reqNums = () => fs.readdirSync(MOCK_LOG).filter(f => /^req-\d+\.json$/.test(f)).map(f => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
export const readReq = n => JSON.parse(fs.readFileSync(`${MOCK_LOG}/req-${n}.json`, 'utf8'));

export async function launch({ width = 1440, height = 900 } = {}) {
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server', '--enable-precise-memory-info', '--js-flags=--expose-gc'] });
    const page = await browser.newPage({ viewport: { width, height } });
    return { browser, page };
}

export async function waitHost(page) {
    await page.waitForFunction(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && window.StoryBlock?.apiVersion === 2, null, { timeout: 120000 });
    await page.waitForFunction(() => StoryBlock.sdk.modules().length >= 4, null, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
}

export async function connectMock(page) {
    await page.evaluate(async url => {
        const $ = window.jQuery;
        $('#main_api').val('openai').trigger('change'); await new Promise(r => setTimeout(r, 400));
        $('#chat_completion_source').val('custom').trigger('change'); await new Promise(r => setTimeout(r, 400));
        $('#custom_api_url_text').val(url).trigger('input');
        $('#custom_model_id').val('mock-model').trigger('input');
        $('#stream_toggle').prop('checked', false).trigger('change');
        $('#api_button_openai').trigger('click');
        await new Promise(r => setTimeout(r, 2500));
    }, MOCK_URL);
}
