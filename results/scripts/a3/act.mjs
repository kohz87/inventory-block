// node act.mjs <cmd> [args]: goto | reload | size W [H] | shot name | wait
import { attach } from './cdp.mjs';
const [cmd, ...rest] = process.argv.slice(2);
const p = await attach();
const ready = () => p.waitFor(() => window.SillyTavern?.getContext?.()?.characters?.length > 0 && document.querySelector('#send_textarea') && (!window.StoryBlock || window.StoryBlock.apiVersion === 2), undefined, 90000);
if (cmd === 'goto') { await p.goto(rest[0] ?? 'http://127.0.0.1:8213/'); console.log('ready', await ready()); await p.sleep(3000); }
if (cmd === 'reload') { await p.reload(); console.log('ready', await ready()); await p.sleep(3000); }
if (cmd === 'size') { await p.setSize(Number(rest[0]), Number(rest[1] ?? (Number(rest[0]) < 500 ? 844 : 900)), Number(rest[0]) < 500); console.log('size set'); }
if (cmd === 'shot') { await p.shot(`/home/user/cell/out/a3/shots/${rest[0]}.jpg`, Number(rest[1] ?? 45)); console.log('shot', rest[0]); }
p.close();
