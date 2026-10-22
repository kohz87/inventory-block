// Shared helpers for the soak live runs. Paths and ports come from the environment (SOAK_* / instance.sh's
// ST_URL, MOCK_URL, MOCK_Q, MOCK_LOG, ST_DATA); the defaults are the beta soak's instance "soak" on 8252/5252.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';

export const SP = '/tmp/claude-0/-home-user-inventory-block/3572f065-fdf3-5cf4-88eb-a15358a57ebe/scratchpad';
const E = process.env;
const INST = E.SOAK_INST ?? 'soak';
export const REPOS = E.SOAK_REPOS ?? '/home/user/soak';
export const OUT = E.SOAK_OUT ?? `${SP}/break/${INST}`;
export const ST_URL = E.ST_URL ?? 'http://127.0.0.1:8252/';
export const MOCK_URL = E.MOCK_URL ?? 'http://127.0.0.1:5252/v1';
export const MOCK_Q = E.MOCK_Q ?? `${SP}/inst/${INST}/q`;
export const MOCK_LOG = E.MOCK_LOG ?? `${SP}/inst/${INST}/log`;
export const ST_DATA = E.ST_DATA ?? `${SP}/inst/${INST}/data`;
export const PACK = `${REPOS}/Story_block/examples/packs/ersveil-bluewatch/pack.json`;
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
    await page.waitForFunction(() => Array.isArray(window.SillyTavern?.getContext?.()?.characters) && window.StoryBlock?.apiVersion === 2 && document.querySelector("#send_textarea") && !document.querySelector("#preloader"), null, { timeout: 120000 });
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
