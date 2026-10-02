import {chromium} from '/tmp/tmshot/node_modules/playwright-core/index.mjs';
import fs from 'fs';
// Check images of the mockup: all tabs, desktop + phone
const dir = new URL('.', import.meta.url).pathname;
const out = dir + 'shots/'; fs.mkdirSync(out, {recursive: true});
const tabs = ['symbole', 'projekte', 'phasen', 'parteien', 'solo', 'regelhefte', 'tastatur'];
const b = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for (const [w, h, mobile] of [[1700, 1000, false], [390, 844, true]]) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2});
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  for (const t of tabs) {
    if (mobile && t === 'tastatur') continue;
    await p.goto('about:blank'); await p.goto('file://' + dir + 'index.html#' + t); await p.waitForTimeout(900);
    await p.screenshot({path: out + `${t}-${w}.png`});
  }
  ctx.close();
}
await b.close(); console.log('done');
