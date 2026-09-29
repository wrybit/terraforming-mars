import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage();
await p.goto('http://localhost:8080/player?id=pdec4d88e26d6');
await p.waitForSelector('.setup-column--corporation .card-container'); await p.waitForTimeout(1500);
const val = (label) => p.evaluate((l) => [...document.querySelectorAll('.setup-summary-item')].find(i => i.querySelector('dt').textContent.startsWith(l))?.querySelector('dd').textContent.trim(), label);
const slug = (col, i) => p.locator(`.setup-column--${col} .card-container`).nth(i).evaluate(e => e.className.match(/card-([a-z0-9-]+)/g).pop().slice(5));
const out = {corps:{}, preludes:{}};
for (let i=0;i<3;i++) { await p.locator('.setup-column--corporation .card-container').nth(i).click(); await p.waitForTimeout(300); out.corps[await slug("corporation",i)] = await val("Start"); await p.locator(".setup-column--corporation .card-container").nth(i).click(); await p.waitForTimeout(200); }
for (let i=0;i<4;i++) { const c=p.locator('.setup-column--prelude .card-container').nth(i); await c.click(); await p.waitForTimeout(300); out.preludes[await slug('prelude',i)] = await val('Prelude'); await c.click(); await p.waitForTimeout(200); }
out.selectedCls = await p.evaluate(() => { const c=document.querySelector('.setup-column--corporation .card-container'); let e=c; const ch=[]; for(let k=0;k<3;k++){ch.push(e.className); e=e.parentElement;} return ch; });
out.status = await p.evaluate(() => [...document.querySelectorAll('.setup-summary-status--open, [class*=setup-summary-status]')].map(e=>e.className+':'+e.textContent));
await p.screenshot({path:'/tmp/setup2.png'});
fs.writeFileSync('/tmp/setup-values.json', JSON.stringify(out));
console.log(JSON.stringify(out,null,1));
await b.close();
