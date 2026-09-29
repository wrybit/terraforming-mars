import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
const ids = ['pe1c4766e5c1f','p432d767487b2'];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage(); p.on('pageerror',e=>console.log('ERR',e.message));
for (const id of []) {
  await p.goto('http://localhost:8080/player?id='+id);
  await p.waitForSelector('.setup-column--corporation .card-container'); await p.waitForTimeout(1000);
  await p.locator('.setup-column--corporation .card-container').first().click();
  const buy = p.locator('.setup-column').last().locator('.card-container');
  for (let i=0;i<4;i++) await buy.nth(i).click();
  await p.waitForTimeout(400);
  await p.locator('.setup-summary-actions button').first().click();
  await p.waitForTimeout(1500);
}
await p.goto('http://localhost:8080/player?id='+ids[0]); await p.waitForTimeout(2500);
await p.screenshot({path:'/tmp/g1.png', scale:'css'});
await b.close();
