import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage();
await p.goto('http://localhost:8080/player?id=pe1c4766e5c1f'); await p.waitForTimeout(2500);
const out = {};
for (const i of [0,1]) {
  await p.locator('.players-table-played').nth(i).click(); await p.waitForTimeout(800);
  out['played'+i] = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.card-container')].filter(c => !c.closest('.wf-root'));
    let e = cards[0]; const chain=[]; while (e && chain.length<6) { chain.push(e.className); e=e.parentElement; }
    return {chain, cards: cards.map(c => c.outerHTML)};
  });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.locator('.players-table-played').nth(i).click().catch(()=>{}); await p.waitForTimeout(400);
}
fs.writeFileSync('/tmp/played.json', JSON.stringify(out));
console.log(out.played0.chain, out.played0.cards.length, out.played1.cards.length);
await b.close();
