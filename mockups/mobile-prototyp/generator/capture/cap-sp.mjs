import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const which = process.argv[2]; // City | Aquifer
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage();
await p.goto('http://localhost:8080/player?id=pe1c4766e5c1f'); await p.waitForTimeout(2500);
await p.locator('.wf-root .or-tab', {hasText: 'Standard'}).first().click(); await p.waitForTimeout(500);
await p.locator(`.wf-root input[value="${which}"]`).evaluate(e => e.closest('label').click()); await p.waitForTimeout(300);
await p.locator('.wf-root .or-tab-footer .btn-submit').click(); await p.waitForTimeout(1500);
const out = await p.evaluate(() => ({
  board: document.querySelector('.board-cont').outerHTML,
  tabs: [...document.querySelectorAll('.wf-root .or-tab')].map(t => ({cls:t.className, text:t.textContent.trim()})),
  panel: document.querySelector('.wf-root .or-tab-panel')?.outerHTML,
  available: [...document.querySelectorAll('.board-space--available')].map(e => e.getAttribute('data_space_id')),
}));
fs.writeFileSync(`/tmp/sp-${which}.json`, JSON.stringify(out));
console.log(which, out.available, out.tabs.map(t=>t.text), (out.panel||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,200));
await p.screenshot({path:`/tmp/sp-${which}.png`});
await b.close();
