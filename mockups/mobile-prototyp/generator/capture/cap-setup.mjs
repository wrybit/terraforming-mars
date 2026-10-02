import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage();
await p.goto('http://localhost:8080/player?id=pdec4d88e26d6');
await p.waitForSelector('.setup-column--corporation .card-container'); await p.waitForTimeout(1500);
await p.screenshot({path:'/tmp/setup.png'});
const info = await p.evaluate(() => {
  const cols = [...document.querySelectorAll('.setup-column')].map(c => ({cls:c.className, head: c.querySelector('h2,h3,.setup-column__title,[class*=title]')?.outerHTML.slice(0,300), cards: c.querySelectorAll('.card-container').length}));
  const root = document.querySelector('.setup-column').parentElement;
  const chain=[]; let e=root; while(e && chain.length<6){chain.push(e.className); e=e.parentElement;}
  const summary = document.querySelector('[class*=setup-summary]');
  return {cols, chain, summaryCls: summary?.className, summary: summary?.outerHTML.slice(0,3000)};
});
console.log(JSON.stringify(info,null,1));
// Entire setup area for the prototype
const html = await p.evaluate(() => { let e=document.querySelector('.setup-column'); while(e && !e.querySelector('[class*=setup-summary]')) e=e.parentElement; return {cls:e.className, html:e.outerHTML}; });
fs.writeFileSync('/tmp/setup.json', JSON.stringify(html));
console.log(html.cls, html.html.length);
await b.close();
