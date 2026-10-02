import {chromium} from '/tmp/tmshot/node_modules/playwright-core/index.mjs';
import fs from 'fs';
// Liest die Inhalte aller Hilfe-Tabs (deutsch, echt gerendert) aus der laufenden App
// und schreibt sie als data.js für das Mockup. Außerdem: Spielansicht als Hintergrundbild.
// Aufruf: lokaler Server auf :8080 muss laufen (npm start), dann: node extract.mjs
const dir = new URL('.', import.meta.url).pathname;
const gameUrl = 'http://localhost:8080/player?id=p9f6b58abd449';
// App-CSS übernehmen; Bildpfade zeigen vom Mockup-Ordner aus auf das Repo-assets/
const css = fs.readFileSync(dir + '../../build/styles.css', 'utf8')
  .replace(/url\((["']?)(?:\.\/|\/)?assets\//g, 'url($1../../assets/');
fs.writeFileSync(dir + 'app.css', '/* Erzeugt von extract.mjs aus build/styles.css – nicht von Hand ändern */\n' + css);
const b = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});

// Hintergrundbilder Desktop + Handy
for (const [w, h, mobile, name] of [[1700, 1000, false, 'bg-desktop.jpg'], [390, 844, true, 'bg-mobile.jpg']]) {
  const ctx = await b.newContext({viewport: {width: w, height: h}, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1});
  await ctx.addInitScript(() => localStorage.setItem('lang', 'de'));
  const p = await ctx.newPage();
  await p.goto(gameUrl); await p.waitForTimeout(2500);
  await p.screenshot({path: dir + name, type: 'jpeg', quality: 80});
  await ctx.close();
}

const ctx = await b.newContext({viewport: {width: 1700, height: 1000}});
await ctx.addInitScript(() => localStorage.setItem('lang', 'de'));
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(gameUrl); await p.waitForTimeout(2500);
await p.locator('.sidebar_item--help').first().click({force: true});
await p.waitForTimeout(1000);
const open = async (id) => { await p.locator(`label[for=radio-${id}]`).click(); await p.waitForTimeout(700); };
const data = {};

await open('symbols');
data.symbols = await p.evaluate(() => {
  // Spalte = Abschnitt; Unterzeilen (grau) = Gruppen innerhalb des Abschnitts
  return [...document.querySelectorAll('.help-icons-column')].map((col) => {
    const section = {title: '', groups: []};
    let group = null;
    for (const child of col.children) {
      const heading = child.querySelector('.help-icons-section-heading');
      const sub = child.querySelector('.help-icon-sublabel');
      if (heading) { section.title = heading.textContent.trim(); continue; }
      if (sub) { group = {title: sub.textContent.trim(), rows: []}; section.groups.push(group); continue; }
      const label = child.querySelector('.help-icon-label');
      if (!label) continue;
      if (!group) { group = {title: '', rows: []}; section.groups.push(group); }
      group.rows.push({
        icon: child.firstElementChild.outerHTML,
        label: label.textContent.trim(),
        expansions: [...child.querySelectorAll('.expansion-icon')].map((e) => e.outerHTML),
      });
    }
    return section;
  });
});

await open('standard-projects');
data.projects = await p.evaluate(() => {
  const out = []; let cur = null;
  for (const el of document.querySelector('.help-standard-projects-container').children) {
    if (el.tagName === 'H2') { cur = {title: el.textContent.trim(), cards: []}; out.push(cur); } else if (cur) cur.cards.push(el.outerHTML);
  }
  return out.filter((s) => s.cards.length);
});

await open('phases');
data.phases = await p.evaluate(() => {
  // Baum: li mit eigenem label = Knoten, sonst Inhaltszeile (HTML)
  const walk = (ul) => [...ul.children].map((li) => {
    const label = [...li.children].find((c) => c.tagName === 'LABEL');
    if (!label) return {html: li.innerHTML.trim()};
    const sub = [...li.children].find((c) => c.tagName === 'UL');
    return {title: label.innerHTML.trim(), children: sub ? walk(sub) : []};
  });
  return walk(document.querySelector('.help-phases-container > ul'));
});

await open('turmoil-parties');
data.parties = await p.evaluate(() => ({
  intro: document.querySelector('.help-turmoil-parties-container > p')?.textContent.trim() ?? '',
  list: [...document.querySelectorAll('.help-party-card')].map((card) => {
    const sections = card.querySelectorAll('.help-agenda-section');
    return {
      name: card.querySelector('.party-name').textContent.trim(),
      logo: card.querySelector('.card-party').outerHTML,
      bonus: [...sections[0].querySelectorAll('.help-agenda-card')].map((e) => e.outerHTML),
      policy: [...sections[1].querySelectorAll('.help-agenda-card')].map((e) => e.outerHTML),
    };
  }),
}));

await open('solo-rules');
data.solo = await p.evaluate(() => {
  const out = []; let cur = null;
  for (const el of document.querySelector('.help-solo-rules-container').children) {
    if (el.classList.contains('help-icons-section-heading')) { cur = {title: el.textContent.trim(), html: ''}; out.push(cur); } else if (cur) cur.html += el.outerHTML;
  }
  return out;
});

await open('rulebooks');
data.rulebooks = await p.evaluate(() => [...document.querySelectorAll('.help-rulebooks-section')].map((s) => ({
  title: s.querySelector('.help-icons-section-heading').textContent.trim(),
  rows: [...s.querySelectorAll('a.help-rulebook-row')].map((a) => ({href: a.href, icon: a.querySelector('div').outerHTML, name: a.textContent.trim()})),
})));

await open('hotkeys');
data.hotkeys = await p.evaluate(() => [...document.querySelectorAll('.help-hotkeys .keys > div')].map((d) => d.textContent.trim()));

fs.writeFileSync(dir + 'data.js', '// Erzeugt von extract.mjs – nicht von Hand ändern\nwindow.HELP_DATA = ' + JSON.stringify(data, null, 1) + ';\n');
await b.close();
console.log('ok', Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v)])));
