// New log lines in the markup of the real log (li with player and card chip).
(function (TM) {
  'use strict';

  var PLAYER_COLORS = {jens: ['Jens', 'green'], mira: ['Mira', 'red']};
  var unread = 0;

  // parts: list of {player: 'jens'}, {text: ' hat '}, {card: 'Titel', kind: 'automated'|'events'|'active'}
  TM.log = function (parts) {
    var list = TM.$('.mb-log-slot .panel-body');
    var line = document.createElement('li');
    var owner = parts.filter(function (part) { return part.player; })[0];
    if (owner) line.className = 'log-line--' + PLAYER_COLORS[owner.player][1];
    line.innerHTML = parts.map(function (part) {
      if (part.player) {
        var player = PLAYER_COLORS[part.player];
        return '<span><span class="log-player player_bg_color_' + player[1] + '">' + player[0] + '</span></span>';
      }
      if (part.card) return '<span><span><span class="log-card background-color-' + (part.kind || 'automated') + '">' + part.card + '</span></span></span>';
      return '<span class="log-plain-text">' + part.text + '</span>';
    }).join('');
    list.appendChild(line);
    list.scrollTop = list.scrollHeight;
    if (!TM.$('.mb-screen[data-screen="log"]').classList.contains('is-active')) {
      unread += 1;
      var badge = document.getElementById('logBadge');
      badge.textContent = unread;
      badge.hidden = false;
    }
  };

  TM.log.generation = function (number) {
    var list = TM.$('.mb-log-slot .panel-body');
    var line = document.createElement('li');
    line.innerHTML = '<span class="log-plain-text">Generation </span><span><span>' + number + '</span></span>';
    list.appendChild(line);
  };

  TM.on('screen', function (screen) {
    if (screen !== 'log') return;
    unread = 0;
    document.getElementById('logBadge').hidden = true;
  });
})(window.TM);

// Earlier generations: tabs tappable, content as sample data from the cards actually played
(function (TM) {
  'use strict';

  // Generations 1–5: real entries of a finished game (build.py converts them)
  var HISTORY = Object.assign({}, window.TM_DATA.logHistory);

  function render(entries) {
    return entries.map(function (entry) {
      if (!entry[0]) return '<li><span class="log-plain-text">' + entry[1] + '</span></li>';
      var parts = [{player: entry[0]}, {text: entry[1]}];
      if (entry[2]) parts.push({card: entry[2], kind: entry[3]});
      var color = entry[0] === 'jens' ? 'green' : 'red';
      var name = entry[0] === 'jens' ? 'Jens' : 'Mira';
      return '<li class="log-line--' + color + '">' + parts.map(function (part) {
        if (part.player) return '<span><span class="log-player player_bg_color_' + color + '">' + name + '</span></span>';
        if (part.card) return '<span><span><span class="log-card background-color-' + part.kind + '">' + part.card + '</span></span></span>';
        return '<span class="log-plain-text">' + part.text + '</span>';
      }).join('') + '</li>';
    }).join('');
  }

  function show(tab) {
    var tabs = TM.$all('.mb-log-slot .log-gen-tabs .or-tab');
    var live = TM.$('.mb-log-slot #logpanel-scrollable');
    var past = TM.$('.mb-log-slot .mb-log-past');
    if (!past) {
      past = document.createElement('div');
      past.className = 'panel-body mb-log-past';
      live.parentNode.insertBefore(past, live);
    }
    var isCurrent = tab === tabs[tabs.length - 1];
    tabs.forEach(function (other) {
      other.classList.toggle('or-tab--active', other === tab);
      other.setAttribute('aria-selected', other === tab ? 'true' : 'false');
    });
    live.hidden = !isCurrent;
    past.hidden = isCurrent;
    var saved = HISTORY[Number(tab.textContent.trim())] || [];
    if (!isCurrent) past.innerHTML = saved.html || render(saved);
  }

  TM.onClick('.mb-log-slot .log-gen-tabs .or-tab', function (tab) { show(tab); });

  // New generation: its own tab, which is active right away
  var addLine = TM.log.generation;
  TM.log.generation = function (number) {
    var list = TM.$('.mb-log-slot .log-gen-tabs');
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'or-tab or-tab--view or-tab--number';
    tab.textContent = number;
    list.appendChild(tab);
    // Log of the new generation starts empty; the old one moves into the sample data
    var live = TM.$('.mb-log-slot #logpanel-scrollable');
    HISTORY[number - 1] = {html: live.innerHTML};
    live.innerHTML = '';
    addLine(number);
    show(tab);
  };
})(window.TM);
