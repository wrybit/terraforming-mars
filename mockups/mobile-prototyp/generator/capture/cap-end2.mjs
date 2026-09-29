import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage();
await p.goto('http://localhost:8080/the-end?id=pe1c4766e5c1f'); await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
  const h = (s) => document.querySelector(s)?.outerHTML || '';
  return {hero: h('.game-end-winer-announcement'), points: h('.game_end_victory_points'), details: h('.game-end-details'), board: h('.game_end_block--board .board-cont')};
});
fs.writeFileSync('/tmp/end-parts.json', JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length])));
await b.close();
