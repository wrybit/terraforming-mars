// Die einzelnen Aktionen des Zugs: was sie kosten, was sie bewirken, wann sie möglich sind.
// Werte und Karteneffekte folgen den echten Karten des Testspiels (Grundspiel + Corporate Era).
(function (TM) {
  'use strict';

  var PLANTS_FOR_GREENERY = 8;
  var HEAT_FOR_TEMPERATURE = 8;
  var MILESTONE_COST = 8;
  var AWARD_COSTS = [8, 14, 20];
  var CARD_PRICE = 3;
  var RESEARCH_CARDS = 4;

  // Effekte der Handkarten, die im Prototyp gespielt werden können
  var CARD_EFFECTS = {
    'domed-crater': {change: {'jens.plants': 3, 'jens.energyProduction': -1, 'jens.megacreditsProduction': 3}, chain: 'place-city'},
    'fueled-generators': {change: {'jens.megacreditsProduction': -1, 'jens.energyProduction': 1}},
    'lunar-beam': {change: {'jens.megacreditsProduction': -2, 'jens.heatProduction': 2, 'jens.energyProduction': 2}},
    'adapted-lichen': {change: {'jens.plantsProduction': 1}},
    'comet': {temperature: 1, chain: 'place-ocean'},
    'research': {change: {'jens.cards': 2}},
  };
  var STANDARD_PROJECTS = {
    'Power Plant:SP': {name: 'Power Plant', change: {'jens.energyProduction': 1}},
    'Asteroid:SP': {name: 'Asteroid', temperature: 1},
    'Aquifer': {name: 'Aquifer', chain: 'place-ocean'},
    'Greenery': {name: 'Greenery', chain: 'greenery', chainOptions: {fromStandard: true}},
    'City': {name: 'City', change: {'jens.megacreditsProduction': 1}, chain: 'place-city'},
  };
  var CARD_ACTIONS = {
    'space-elevator': {needs: {steel: 1}, change: {'jens.steel': -1, 'jens.megacredits': 5}, text: '1 steel → 5 M€'},
    'development-center': {needs: {energy: 1}, change: {'jens.energy': -1, 'jens.cards': 1}, text: '1 energy → 1 card'},
    'tardigrades': {needs: {}, counter: 1, text: '+1 microbe'},
  };

  var researchOffset = 0;

  function kindOf(card) {
    var title = card.querySelector('[class*="background-color-"]');
    var match = title && title.className.match(/background-color-(\w+)/);
    return match ? match[1] : 'automated';
  }

  // Globale Parameter heben und dafür TW gutschreiben, wie im Original
  function raise(parameter, steps, player) {
    var limits = {temperature: [8, 2], oxygen: [14, 1], oceans: [9, 1]}[parameter];
    var raised = 0;
    for (var step = 0; step < steps && TM.state.game[parameter] < limits[0]; step++) {
      TM.state.game[parameter] += limits[1];
      TM.state[player || 'jens'].tr += 1;
      raised += 1;
    }
    TM.render();
    return raised;
  }
  TM.raise = raise;

  function hand() { return TM.$all('.mb-panel[data-key="sell"] label .card-container'); }

  function affordable(card) {
    var cost = TM.costOf(card);
    var budget = TM.get('jens.megacredits')
      + (card.querySelector('.tag-building') ? TM.get('jens.steel') * 2 : 0)
      + (card.querySelector('.tag-space') ? TM.get('jens.titanium') * 3 : 0);
    return cost <= budget;
  }

  function awardCost() { return AWARD_COSTS[Math.min(TM.state.game.fundedAwards, AWARD_COSTS.length - 1)]; }

  // ---------- Zug-Menü: Kacheln nach Spielstand freigeben ----------
  function setTile(key, enabled, sub) {
    TM.$all('.mb-tile[data-task="' + key + '"]').forEach(function (tile) {
      var highlighted = /mb-tile--(success|heat|highlight)/.test(tile.className);
      if (highlighted) tile.hidden = !enabled; // wie im Original: Sonder-Reiter nur, wenn möglich
      tile.classList.toggle('is-done', !enabled);
      if (sub) tile.querySelector('.mb-tile-sub').textContent = sub;
    });
  }

  function refreshTiles() {
    var jens = TM.state.jens;
    setTile('greenery', jens.plants >= PLANTS_FOR_GREENERY && TM.board.freeSpaces('greenery').length > 0);
    setTile('heat', jens.heat >= HEAT_FOR_TEMPERATURE && TM.state.game.temperature < 8,
      'Temperature rises from ' + TM.state.game.temperature + ' °C to ' + (TM.state.game.temperature + 2) + ' °C');
    setTile('milestone', !TM.state.game.gardenerClaimed && TM.state.game.claimedMilestones < 3 && jens.megacredits >= MILESTONE_COST);
    TM.$all('.mb-tile[data-task="award"] .mb-tile-label').forEach(function (label) { label.textContent = 'Award (' + awardCost() + ' M€)'; });
    setTile('award', TM.state.game.fundedAwards < 3 && jens.megacredits >= awardCost());
    var actions = TM.$all('.mb-panel[data-key="actions"] label').filter(function (label) { return !label.classList.contains('mb-used') && canUseAction(label); });
    setTile('actions', actions.length > 0, actions.length + ' available');
    var playable = TM.$all('.mb-panel[data-key="build"] label .card-container').filter(affordable);
    setTile('build', playable.length > 0, playable.length + ' playable');
    var projects = TM.$all('.mb-panel[data-key="standard"] label .card-container').filter(affordable);
    setTile('standard', projects.length > 0, projects.length + ' affordable');
    setTile('sell', hand().length > 0, hand().length + ' cards in hand');
  }

  function canUseAction(label) {
    var action = CARD_ACTIONS[TM.slugOf(label.querySelector('.card-container'))];
    if (!action) return false;
    return Object.keys(action.needs).every(function (resource) { return TM.get('jens.' + resource) >= action.needs[resource]; });
  }

  // ---------- Platzieren ----------
  function placement(type, onPlaced) {
    return {
      place: type,
      confirm: function (panel, options) {
        var spaceId = TM.board.pickedSpace();
        if (!spaceId) return false;
        TM.board.placeTile(spaceId, type, 'green');
        return onPlaced(options || {});
      },
    };
  }

  TM.tasks.define('greenery', placement('greenery', function (options) {
    if (!options.fromStandard) TM.add('jens.plants', -PLANTS_FOR_GREENERY);
    var raised = raise('oxygen', 1);
    TM.log([{player: 'jens'}, {text: ' placed a '}, {card: 'Greenery', kind: 'automated'}]);
    return {message: 'Greenery placed' + (raised ? ' · oxygen ' + (TM.state.game.oxygen - 1) + ' → ' + TM.state.game.oxygen + ' %' : '')};
  }));
  TM.tasks.define('place-city', placement('city', function () {
    TM.log([{player: 'jens'}, {text: ' placed a '}, {card: 'City', kind: 'automated'}]);
    return {message: 'City placed'};
  }));
  TM.tasks.define('place-ocean', placement('ocean', function () {
    raise('oceans', 1);
    TM.log([{player: 'jens'}, {text: ' placed an '}, {card: 'Ocean', kind: 'automated'}]);
    return {message: 'Ocean placed · ' + TM.state.game.oceans + ' of 9'};
  }));

  // ---------- Wärme ----------
  TM.tasks.define('heat', {
    confirm: function () {
      TM.add('jens.heat', -HEAT_FOR_TEMPERATURE);
      var before = TM.state.game.temperature;
      raise('temperature', 1);
      TM.log([{player: 'jens'}, {text: ' raised the temperature to ' + TM.state.game.temperature + ' °C'}]);
      return {message: 'Temperature ' + before + ' → ' + TM.state.game.temperature + ' °C'};
    },
  });

  // ---------- Meilenstein und Auszeichnung ----------
  function markOwner(selector) {
    var block = TM.$('.mb-ma-slot ' + selector);
    if (block) block.insertAdjacentHTML('beforeend', '<span class="mb-ma-owner log-player player_bg_color_green">Jens</span>');
  }

  TM.tasks.define('milestone', {
    preselectFirst: true,
    confirm: function (panel) {
      var name = TM.$('label.mb-selected', panel).textContent.trim();
      TM.change({'jens.megacredits': -MILESTONE_COST, 'game.claimedMilestones': 1});
      TM.state.game.gardenerClaimed = true;
      markOwner('.ma-name--gardener');
      TM.log([{player: 'jens'}, {text: ' claimed the milestone ' + name}]);
      refreshTiles();
      return {message: 'Milestone ' + name + ' claimed · 5 VP'};
    },
  });

  TM.tasks.define('award', {
    preselectFirst: true,
    open: function (panel) { panel.dataset.title = 'Award (' + awardCost() + ' M€)'; document.getElementById('taskTitle').textContent = panel.dataset.title; },
    confirm: function (panel) {
      var label = TM.$('label.mb-selected', panel);
      var name = label.textContent.trim();
      var cost = awardCost();
      TM.change({'jens.megacredits': -cost, 'game.fundedAwards': 1});
      var type = label.querySelector('[class*="ma-name--"]').className.match(/ma-name--(\w+)/g).pop();
      markOwner('.' + type);
      label.remove();
      TM.log([{player: 'jens'}, {text: ' funded the award ' + name}]);
      return {message: name + ' funded · ' + cost + ' M€'};
    },
  });

  // ---------- Kartenaktionen ----------
  TM.tasks.define('actions', {
    open: function (panel) {
      TM.$all('label', panel).forEach(function (label) { label.classList.toggle('mb-unusable', !canUseAction(label)); });
    },
    refresh: function (panel, button) {
      var label = TM.$('label.mb-selected', panel);
      button.disabled = !label || label.classList.contains('mb-used') || !canUseAction(label);
    },
    confirm: function (panel) {
      var label = TM.$('label.mb-selected', panel);
      var card = label.querySelector('.card-container');
      var slug = TM.slugOf(card);
      var action = CARD_ACTIONS[slug];
      if (action.change) TM.change(action.change);
      if (action.counter) TM.cards.setCounter(slug, action.counter);
      label.classList.add('mb-used');
      label.querySelector('input').checked = false;
      TM.log([{player: 'jens'}, {text: ' used the action of '}, {card: TM.titleOf(card), kind: 'active'}]);
      return {message: TM.titleOf(card) + ': ' + action.text};
    },
  });

  // ---------- Bauen ----------
  TM.tasks.define('build', {
    preselectFirst: true,
    open: function () { TM.carousel.show(); },
    refresh: function (panel, button) {
      var card = TM.tasks.selectedCard();
      var spent = TM.payment.spent(document.getElementById('taskbar'));
      button.disabled = !card || spent.megacredits > TM.state.jens.megacredits;
    },
    confirm: function () {
      var card = TM.tasks.selectedCard();
      var slug = TM.slugOf(card);
      var title = TM.titleOf(card);
      var spent = TM.payment.spent(document.getElementById('taskbar'));
      TM.change({'jens.megacredits': -spent.megacredits, 'jens.steel': -spent.steel, 'jens.titanium': -spent.titanium, 'jens.cards': -1});
      var effect = CARD_EFFECTS[slug] || {};
      if (effect.change) TM.change(effect.change);
      if (effect.temperature) raise('temperature', effect.temperature);
      TM.cards.addToPlayed(card, 'jens');
      TM.log([{player: 'jens'}, {text: ' played '}, {card: title, kind: kindOf(card)}]);
      TM.cards.removeEverywhere(slug);
      var paid = spent.megacredits + ' M€' + (spent.steel ? ' + ' + spent.steel + ' steel' : '') + (spent.titanium ? ' + ' + spent.titanium + ' titanium' : '');
      return {message: title + ' played · ' + paid, chain: effect.chain ? {key: effect.chain} : null};
    },
  });

  // ---------- Standardprojekte ----------
  TM.tasks.define('standard', {
    preselectFirst: true,
    refresh: function (panel, button) {
      var card = TM.tasks.selectedCard();
      button.disabled = !card || !affordable(card) || (TM.$('label.mb-selected input', panel).value === 'Greenery' && !TM.board.freeSpaces('greenery').length);
    },
    confirm: function (panel) {
      var card = TM.tasks.selectedCard();
      var project = STANDARD_PROJECTS[TM.$('label.mb-selected input', panel).value];
      var cost = TM.costOf(card);
      TM.add('jens.megacredits', -cost);
      if (project.change) TM.change(project.change);
      if (project.temperature) raise('temperature', project.temperature);
      TM.log([{player: 'jens'}, {text: ' used the standard project '}, {card: project.name, kind: 'automated'}]);
      return {message: project.name + ' · ' + cost + ' M€', chain: project.chain ? {key: project.chain, options: project.chainOptions} : null};
    },
  });

  // ---------- Verkaufen ----------
  TM.tasks.define('sell', {
    refresh: function (panel, button) {
      var count = TM.$all('input:checked', panel).length;
      button.querySelector('span').textContent = 'Sell ' + count;
      button.disabled = count === 0;
    },
    confirm: function (panel) {
      var sold = TM.$all('input:checked', panel).map(function (input) { return input.closest('label').querySelector('.card-container'); });
      sold.forEach(function (card) { TM.cards.removeEverywhere(TM.slugOf(card)); });
      TM.change({'jens.megacredits': sold.length, 'jens.cards': -sold.length});
      TM.log([{player: 'jens'}, {text: ' sold ' + sold.length + ' card(s)'}]);
      return {message: 'Sold ' + sold.length + ' card(s) for ' + sold.length + ' M€'};
    },
  });

  // ---------- Forschungsphase: Karten kaufen ----------
  function buildResearchPanel() {
    var panel = document.createElement('div');
    panel.className = 'mb-panel';
    panel.dataset.key = 'research';
    panel.dataset.title = 'Research';
    panel.dataset.sub = 'Buy cards for ' + CARD_PRICE + ' M€ each';
    panel.dataset.tone = '';
    panel.innerHTML = '<div class="or-tab-panel"><div class="wf-component wf-component--select-card"></div>'
      + '<div class="or-tab-footer"><div class="nofloat select-card-actions"><button class="btn btn-submit btn-rounded"><span>Buy 0 cards</span></button></div></div></div>';
    TM.$('.mb-task-body').insertBefore(panel, document.getElementById('placeWrap'));
  }

  function dealResearchCards() {
    var list = TM.$('.mb-panel[data-key="research"] .wf-component');
    list.innerHTML = '';
    var pool = TM.$all('.setup-column--projects .card-container');
    for (var index = 0; index < RESEARCH_CARDS; index++) {
      var card = TM.scale.fresh(pool[(researchOffset + index) % pool.length]);
      var label = document.createElement('label');
      label.className = 'cardbox';
      label.innerHTML = '<input type="checkbox">';
      label.appendChild(card);
      list.appendChild(label);
    }
    researchOffset += RESEARCH_CARDS;
    TM.scale.soon();
  }

  // Gekaufte Karte überall dort einfügen, wo das Original Handkarten zeigt
  function addToHand(card) {
    var handList = TM.$all('.mb-screen[data-screen="hand"] .hand-cards-panel__cards').pop();
    var box = document.createElement('div');
    box.className = 'cardbox';
    box.appendChild(TM.scale.fresh(card));
    handList.appendChild(box);
    var build = document.createElement('label');
    build.className = 'payments_cards';
    build.innerHTML = '<input class="hidden" type="radio" name="mb-build">';
    build.appendChild(TM.scale.fresh(card));
    TM.$('.mb-panel[data-key="build"] .payments_cont').appendChild(build);
    var sell = document.createElement('label');
    sell.className = 'cardbox';
    sell.innerHTML = '<input type="checkbox">';
    sell.appendChild(TM.scale.fresh(card));
    TM.$('.mb-panel[data-key="sell"] .wf-component--select-card').appendChild(sell);
  }

  TM.tasks.define('research', {
    open: dealResearchCards,
    refresh: function (panel, button) {
      var count = TM.$all('input:checked', panel).length;
      button.querySelector('span').textContent = count ? 'Buy ' + count + ' card' + (count > 1 ? 's' : '') + ' · ' + count * CARD_PRICE + ' M€' : 'Buy none';
      button.disabled = count * CARD_PRICE > TM.state.jens.megacredits;
    },
    confirm: function (panel) {
      var bought = TM.$all('input:checked', panel).map(function (input) { return input.closest('label').querySelector('.card-container'); });
      bought.forEach(addToHand);
      TM.change({'jens.megacredits': -bought.length * CARD_PRICE, 'jens.cards': bought.length});
      TM.$all('.mb-panel[data-key="actions"] label').forEach(function (label) { label.classList.remove('mb-used'); });
      TM.log([{player: 'jens'}, {text: ' bought ' + bought.length + ' card(s)'}]);
      TM.scale.soon();
      return {message: (bought.length ? bought.length + ' card(s) bought · ' : '') + 'Generation ' + TM.state.game.generation + ' starts', free: true};
    },
  });

  TM.actions = {
    init: function () {
      buildResearchPanel();
      TM.on('state', refreshTiles);
      TM.on('generation', refreshTiles);
    },
    refreshTiles: refreshTiles,
  };
})(window.TM);
