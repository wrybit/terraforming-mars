// Help overlay mockup: builds all tabs from window.HELP_DATA (real app content, see extract.mjs).
// Each tab provides a section tree (page tree/chips) and the content – same pattern for all tabs.
(function () {
  const data = window.HELP_DATA;
  const textOf = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); };
  let idCounter = 0;
  const newId = (prefix) => `${prefix}-${++idCounter}`;

  // Short, descriptive subtitles instead of the long original headings
  const symbolGroupTitles = {
    '': 'Grundspiel & offizielle Erweiterungen',
    'Kartensymbole von Fan-Erweiterungen': 'Fan-Erweiterungen',
    'Standardressourcen': 'Standardressourcen',
    'Ressourcen auf Karten': 'Auf Karten',
    'Fan Expansion Card Resources': 'Auf Karten (Fan)',
  };
  const projectTitles = ['Grundspiel', 'Erweiterungen & Solo', 'Fan-Erweiterungen'];
  const partyNames = {'MARS ZUERST': 'Mars zuerst', 'FORSCHUNG': 'Forschung', 'EINIGKEIT': 'Einigkeit', 'KELVINISTEN': 'Kelvinisten', 'DIE ROTEN': 'Die Roten', 'DIE GRÜNEN': 'Die Grünen'};

  // ---- Tab building blocks ----
  function buildSymbols() {
    const nav = []; let html = '';
    for (const section of data.symbols) {
      const sectionId = newId('sym');
      const groups = section.groups.filter((g) => g.rows.length);
      const navItem = {id: sectionId, label: section.title, count: groups.reduce((n, g) => n + g.rows.length, 0), children: []};
      html += `<section class="hx-section" id="${sectionId}" data-search-scope><h2 class="hx-section-title">${section.title}</h2>`;
      for (const group of groups) {
        const groupId = newId('sym');
        const title = groups.length > 1 || group.title ? (symbolGroupTitles[group.title] ?? group.title) : '';
        if (title && groups.length > 1) navItem.children.push({id: groupId, label: title, count: group.rows.length});
        html += `<div class="hx-group" id="${groupId}" data-search-scope>${title && groups.length > 1 ? `<h3 class="hx-group-title">${title}</h3>` : ''}<div class="hx-rows">`;
        for (const row of group.rows) {
          html += `<div class="hx-row" data-search="${row.label}"><div class="hx-icon">${row.icon}</div><span class="hx-label">${row.label}</span><span class="hx-exp">${row.expansions.join('')}</span></div>`;
        }
        html += '</div></div>';
      }
      html += '</section>';
      nav.push(navItem);
    }
    return {nav, html};
  }

  function buildProjects() {
    const nav = []; let html = '';
    data.projects.forEach((section, index) => {
      const id = newId('prj');
      const title = projectTitles[index] ?? section.title;
      nav.push({id, label: title, count: section.cards.length});
      html += `<section class="hx-section" id="${id}" data-search-scope><h2 class="hx-section-title">${title}</h2><div class="hx-cards">`;
      html += section.cards.map((card) => `<div data-search="${textOf(card)}">${card}</div>`).join('');
      html += '</div></section>';
    });
    return {nav, html};
  }

  // Phases: tree from the app (li with label = node). Content lines of the form "<span>Titel</span><ul>…" become sub-steps.
  function buildPhases() {
    const nav = []; let html = '';
    const leafToSubstep = (leafHtml) => {
      const d = document.createElement('div'); d.innerHTML = leafHtml;
      const first = d.firstElementChild;
      if (first && first.tagName === 'SPAN' && /^[ivx]+\./i.test(first.textContent.trim())) {
        const title = first.textContent.trim(); first.remove();
        return {title, body: d.innerHTML};
      }
      return null;
    };
    const listHtml = (leaves) => `<ul>${leaves.map((l) => `<li data-search="${textOf(l.html)}">${l.html}</li>`).join('')}</ul>`;
    for (const top of data.phases) {
      const id = newId('ph');
      const navItem = {id, label: textOf(top.title), children: []};
      html += `<section class="hx-section" id="${id}" data-search-scope><h2 class="hx-section-title">${top.title}</h2>`;
      const steps = top.children.filter((c) => c.children);
      if (steps.length === 0) {
        html += `<div class="hx-prose">${listHtml(top.children)}</div>`;
      } else {
        steps.forEach((step, index) => {
          const stepId = newId('ph');
          const stepNav = {id: stepId, label: textOf(step.title).replace(/\(\s*/, '(').replace(/\s*\)/, ')'), children: []};
          html += `<div class="hx-step" id="${stepId}" data-search-scope><span class="hx-step-no">${index + 1}</span><h3 class="hx-step-title">${step.title}</h3><div class="hx-prose">`;
          const plain = [];
          for (const leaf of step.children) {
            const sub = leaf.html !== undefined ? leafToSubstep(leaf.html) : null;
            if (sub) {
              const subId = newId('ph');
              stepNav.children.push({id: subId, label: sub.title});
              html += `<div class="hx-substep" id="${subId}" data-search="${sub.title} ${textOf(sub.body)}"><div class="hx-substep-title">${sub.title}</div>${sub.body}</div>`;
            } else plain.push(leaf);
          }
          if (plain.length) html += listHtml(plain);
          html += '</div></div>';
          navItem.children.push(stepNav);
        });
      }
      html += '</section>';
      nav.push(navItem);
    }
    return {nav, html};
  }

  function buildParties() {
    const nav = [];
    // Original intro is still untranslated – here the German version
    let html = `<p class="hx-section-lead" style="margin:0 0 16px">Der Bonus einer Partei gilt einmalig in der Aufruhr-Phase. Ihre Politik gilt nur während der Aktionsphase der folgenden Generation.</p>`;
    for (const party of data.parties.list) {
      const id = newId('pty');
      const name = partyNames[party.name] ?? party.name;
      nav.push({id, label: name});
      const logo = party.logo.replace('class="', 'class="hx-party-logo ');
      html += `<section class="hx-section" id="${id}" data-search-scope><h2 class="hx-section-title">${logo}${name}</h2>
        <div class="hx-group" data-search-scope><h3 class="hx-group-title">Bonus · einmalig in der Aufruhr-Phase</h3><div class="hx-agendas">${party.bonus.map((b) => `<div data-search="${textOf(b)}">${b}</div>`).join('')}</div></div>
        <div class="hx-group" data-search-scope><h3 class="hx-group-title">Politik · in der Aktionsphase danach</h3><div class="hx-agendas">${party.policy.map((b) => `<div data-search="${textOf(b)}">${b}</div>`).join('')}</div></div></section>`;
    }
    return {nav, html};
  }

  function buildSolo() {
    const nav = []; let html = '';
    for (const section of data.solo) {
      const id = newId('solo');
      nav.push({id, label: section.title});
      html += `<section class="hx-section" id="${id}" data-search="${section.title} ${textOf(section.html)}"><h2 class="hx-section-title">${section.title}</h2><div class="hx-prose help-solo-rules-container">${section.html}</div></section>`;
    }
    return {nav, html};
  }

  function buildRulebooks() {
    const nav = []; let html = '';
    for (const section of data.rulebooks) {
      const id = newId('rb');
      nav.push({id, label: section.title, count: section.rows.length});
      html += `<section class="hx-section" id="${id}" data-search-scope><h2 class="hx-section-title">${section.title}</h2><div class="hx-links">`;
      html += section.rows.map((row) => `<a class="hx-link" href="${row.href}" target="_blank" rel="noopener" data-search="${row.name}">${row.icon}<span class="hx-link-name">${row.name}</span><span class="hx-link-arrow">↗</span></a>`).join('');
      html += '</div></section>';
    }
    return {nav, html};
  }

  // Keyboard: dark key row (A–F highlighted) + per key a mini sketch of the game view with the target area
  function screenSketch(target) {
    // Schematic game view: player table top left, cards bottom left, Mars right, colonies below Mars
    const area = (name, shape) => shape.replace('<rect', `<rect class="hx-sk-area${name === target ? ' is-target' : ''}"`).replace('<circle', `<circle class="hx-sk-area${name === target ? ' is-target' : ''}"`);
    return `<svg class="hx-sketch" viewBox="0 0 160 100" aria-hidden="true">
      <rect class="hx-sk-frame" x="0.5" y="0.5" width="159" height="99" rx="6"/>
      ${area('players', '<rect x="8" y="8" width="84" height="26" rx="3"/>')}
      ${area('hand', '<rect x="8" y="40" width="84" height="52" rx="3"/>')}
      ${area('board', '<circle cx="126" cy="38" r="26"/>')}
      ${area('colonies', '<rect x="100" y="72" width="52" height="20" rx="3"/>')}
    </svg>`;
  }
  function buildHotkeys() {
    const viewsId = newId('key'); const closeId = newId('key');
    const targets = ['board', 'players', 'hand', 'colonies'];
    const shortcuts = data.hotkeys.map((label, i) => ({key: 'ASDF'[i], label, target: targets[i]}));
    const homeRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const keyboard = `<div class="hx-keyrow" aria-hidden="true"><span class="hx-key hx-key--wide">⇪</span>${homeRow.map((k) => `<span class="hx-key${'ASDF'.includes(k) ? ' is-hot' : ''}">${k}</span>`).join('')}</div>`;
    const tiles = shortcuts.map((s) => `<div class="hx-shortcut" data-search="${s.key} ${s.label}">${screenSketch(s.target)}<div class="hx-shortcut-text"><span class="hx-key is-hot">${s.key}</span><span>${s.label}</span></div></div>`).join('');
    return {nav: [{id: viewsId, label: 'Ansichten wechseln'}, {id: closeId, label: 'Fenster'}],
      html: `<section class="hx-section" id="${viewsId}" data-search-scope><h2 class="hx-section-title">Ansichten wechseln</h2><p class="hx-section-lead">Springt direkt zum Bereich der Spielansicht</p>${keyboard}<div class="hx-shortcuts">${tiles}</div></section>
        <section class="hx-section" id="${closeId}" data-search-scope><h2 class="hx-section-title">Fenster</h2><div class="hx-shortcuts"><div class="hx-shortcut-text" data-search="Esc Hilfe schließen"><span class="hx-key hx-key--wide is-hot">Esc</span><span>Hilfe und andere Fenster schließen</span></div></div></section>`};
  }

  const tabs = [
    {key: 'symbole', label: 'Symbole', build: buildSymbols},
    {key: 'projekte', label: 'Standardprojekte', build: buildProjects},
    {key: 'phasen', label: 'Phasen', build: buildPhases},
    {key: 'parteien', label: 'Parteien', build: buildParties},
    {key: 'solo', label: 'Solo-Regeln', build: buildSolo},
    {key: 'regelhefte', label: 'Regelhefte', build: buildRulebooks},
    // Keyboard only makes sense with mouse/keyboard – hidden on phones
    {key: 'tastatur', label: 'Tastatur', build: buildHotkeys, desktopOnly: true},
  ];

  // ---- Rendering ----
  const tabBar = document.getElementById('hx-tabs');
  const subnav = document.getElementById('hx-subnav');
  const content = document.getElementById('hx-content');
  const searchInput = document.getElementById('hx-search-input');
  let observer = null;

  const renderTree = (items) => `<ul>${items.map((item) => `<li><a data-target="${item.id}">${item.label}${item.count ? `<span class="hx-count">${item.count}</span>` : ''}</a>${item.children && item.children.length ? renderTree(item.children) : ''}</li>`).join('')}</ul>`;

  function fitIcons() {
    // Fit icons of different sizes uniformly into their slot
    for (const slot of content.querySelectorAll('.hx-icon')) {
      const el = slot.firstElementChild; if (!el) continue;
      el.style.transform = '';
      const r = el.getBoundingClientRect(); const box = slot.getBoundingClientRect().width - 2;
      const s = Math.min(box / Math.max(r.width, 1), box / Math.max(r.height, 1), 1.4);
      if (s < 0.98 || s > 1.02) el.style.transform = `scale(${s})`;
    }
  }

  function setActiveNav(id) {
    for (const a of subnav.querySelectorAll('a')) a.classList.toggle('is-active', a.dataset.target === id);
    const active = subnav.querySelector('a.is-active');
    // On phones keep the active chip in view
    if (active && getComputedStyle(subnav).overflowX === 'auto') active.scrollIntoView({block: 'nearest', inline: 'nearest'});
  }

  function watchSections() {
    observer?.disconnect();
    const targets = [...subnav.querySelectorAll('a')].map((a) => document.getElementById(a.dataset.target)).filter(Boolean);
    const visible = new Set();
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      // Deepest visible entry in document order that is at the top of the view
      const top = content.getBoundingClientRect().top;
      let best = null;
      for (const t of targets) { if (!visible.has(t)) continue; if (t.getBoundingClientRect().top <= top + 80) best = t; else if (!best) best = t; }
      if (best) setActiveNav(best.id);
    }, {root: content, rootMargin: '0px 0px -60% 0px'});
    targets.forEach((t) => observer.observe(t));
  }

  function showTab(key) {
    const tab = tabs.find((t) => t.key === key) ?? tabs[0];
    for (const b of tabBar.children) b.setAttribute('aria-selected', String(b.dataset.key === tab.key));
    const built = tab.build();
    subnav.innerHTML = renderTree(built.nav).replace('<ul>', '<ul class="hx-tree">');
    content.innerHTML = built.html + '<div class="hx-empty hx-hidden">Nichts gefunden</div>';
    content.scrollTop = 0;
    searchInput.value = '';
    try { history.replaceState(null, '', '#' + tab.key); } catch (e) { /* file:// */ }
    requestAnimationFrame(() => { fitIcons(); watchSections(); setActiveNav(built.nav[0]?.id); });
  }

  tabBar.innerHTML = tabs.map((t) => `<button class="hx-tab${t.desktopOnly ? ' hx-tab--desktop' : ''}" role="tab" data-key="${t.key}">${t.label}</button>`).join('');
  tabBar.addEventListener('click', (e) => { const b = e.target.closest('.hx-tab'); if (b) showTab(b.dataset.key); });
  subnav.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-target]'); if (!a) return;
    document.getElementById(a.dataset.target)?.scrollIntoView({behavior: 'smooth', block: 'start'});
    setActiveNav(a.dataset.target);
  });

  // Search in the current tab: hides non-matching entries and empty sections
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    for (const el of content.querySelectorAll('[data-search]')) el.classList.toggle('hx-hidden', q !== '' && !el.dataset.search.toLowerCase().includes(q));
    for (const scope of [...content.querySelectorAll('[data-search-scope]')].reverse()) {
      const any = scope.querySelector('[data-search]:not(.hx-hidden)');
      scope.classList.toggle('hx-hidden', q !== '' && !any);
    }
    const anyVisible = content.querySelector('.hx-section:not(.hx-hidden)');
    content.querySelector('.hx-empty').classList.toggle('hx-hidden', !!anyVisible);
  });

  window.addEventListener('resize', fitIcons);
  showTab(location.hash.slice(1));
})();
