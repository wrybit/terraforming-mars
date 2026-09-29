import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx = await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(() => localStorage.setItem('lang','en'));
const p = await ctx.newPage();
await p.goto('http://localhost:8080/player?id=pe1c4766e5c1f'); await p.waitForTimeout(2500);
const out = {};
const html = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.outerHTML : null; }, sel);
out.board = await html('.board-cont');
out.milestones = await html('.player_home_block--milestones-and-awards');
out.log = await html('.player-home-columns__log');
out.players = await html('.players-overview');
out.title = await p.evaluate(() => document.querySelector('.player-home-columns__main h2, .wf-root h2, .player-home-columns__main .player_home_block--actions')?.textContent.trim().slice(0,80));
out.tabs = await p.evaluate(() => [...document.querySelectorAll('.wf-root .or-tab')].map(t => ({cls: t.className, text: t.textContent.trim()})));
out.panels = {};
const labels = out.tabs.map(t => t.text).filter(Boolean);
for (const [i, t] of out.tabs.entries()) {
  if (!t.text) continue;
  await p.locator('.wf-root .or-tab').nth(i).click(); await p.waitForTimeout(700);
  out.panels[t.text] = await html('.wf-root .or-tab-panel');
  if (t.text.startsWith('Place greenery')) { out.boardPlace = await html('.board-cont'); await p.screenshot({path:'/tmp/place.png'}); }
}
fs.writeFileSync('/tmp/fragments.json', JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(out).map(([k,v]) => [k, typeof v === 'string' ? v.length : (Array.isArray(v)? v.map(x=>x.text) : Object.fromEntries(Object.entries(v||{}).map(([a,b])=>[a,b&&b.length])))])));
await b.close();
