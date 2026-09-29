import {chromium} from '/home/claude/node_modules/playwright/index.mjs';
import fs from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p = await (await b.newContext({viewport:{width:390,height:844}})).newPage();
await p.goto('http://localhost:8770/index.html'); await p.waitForTimeout(1000);
const urls = await p.evaluate(() => {
  document.querySelectorAll('.mb-screen, .mb-panel, .mb-played, .mb-sheet, [hidden]').forEach(e => { e.hidden = false; e.style.display = 'flex'; });
  document.querySelectorAll('.board-space').forEach(e => e.classList.add('board-space--available', 'mb-picked'));
  const set = new Set();
  for (const el of document.querySelectorAll('*')) for (const pseudo of [null, '::before', '::after']) {
    const bg = getComputedStyle(el, pseudo).backgroundImage;
    for (const m of bg.matchAll(/url\("([^"]+)"\)/g)) set.add(m[1]);
  }
  document.querySelectorAll('img').forEach(i => set.add(i.src));
  return [...set];
});
const rel = urls.filter(u => u.includes('/assets/')).map(u => decodeURIComponent(u.split('/assets/')[1]));
const used = JSON.parse(fs.readFileSync('/tmp/used.json'));
const all = [...new Set([...rel, ...used])];
fs.writeFileSync('/tmp/used.json', JSON.stringify(all));
console.log(all.length);
await b.close();
