// Zugfolge: zwei Aktionen je Zug, Passen, Gegnerzug, Generationsende mit Produktion.
(function (TM) {
  'use strict';

  var ACTIONS_PER_TURN = 2;

  TM.turn = {
    active: 'jens',
    actionsDone: 0,
    passed: {jens: false, mira: false},

    canAct: function () { return TM.turn.active === 'jens' && !TM.turn.passed.jens && !TM.state.game.over; },

    waitingText: function () {
      if (TM.state.game.over) return 'The game is over.';
      return TM.turn.passed.jens ? 'You passed – Mira finishes the generation.' : 'Mira is playing – you are next.';
    },

    renderBanner: function () {
      var mine = TM.turn.active === 'jens';
      var banner = document.getElementById('turnBanner');
      banner.classList.toggle('mb-turn--waiting', !mine || TM.turn.passed.jens);
      document.getElementById('turnTitle').textContent = mine && !TM.turn.passed.jens ? 'Your turn' : 'Mira’s turn';
      var step = TM.state.game.over ? '' : TM.turn.passed.jens ? 'you passed'
        : mine ? 'Action ' + Math.min(TM.turn.actionsDone + 1, ACTIONS_PER_TURN) + ' of ' + ACTIONS_PER_TURN : 'please wait';
      TM.$all('[data-turn-step]').forEach(function (element) { element.textContent = step; });
      document.getElementById('turnButton').classList.toggle('is-idle', !TM.turn.canAct());
      // Wie im Original: die zweite Aktion darf man auslassen, erst nachdem die erste gemacht ist
      var skip = TM.$('[data-skip]');
      if (skip) skip.disabled = !(mine && TM.turn.actionsDone === 1);
    },

    actionDone: function (message, result) {
      TM.toast(message);
      // Kartenkauf der Forschungsphase ist keine Aktion
      if (result && result.free) { TM.turn.renderBanner(); return; }
      TM.turn.actionsDone += 1;
      if (TM.state.game.over) return;
      if (TM.turn.actionsDone >= ACTIONS_PER_TURN) TM.turn.handOver();
      else TM.turn.renderBanner();
    },

    pass: function () {
      TM.nav.closeSheet();
      TM.turn.passed.jens = true;
      TM.log([{player: 'jens'}, {text: ' passed'}]);
      TM.toast('You passed');
      TM.turn.handOver();
    },

    // Zweite Aktion auslassen: Zug endet, Spieler bleibt in der Generation
    skip: function () {
      TM.nav.closeSheet();
      TM.log([{player: 'jens'}, {text: ' ended turn'}]);
      TM.toast('Turn ended – Mira is next');
      TM.turn.handOver();
    },

    handOver: function () {
      TM.turn.active = 'mira';
      TM.turn.renderBanner();
      TM.wait(1400).then(TM.opponent.play).then(function () {
        if (TM.turn.passed.jens && TM.turn.passed.mira) return TM.turn.endGeneration();
        if (TM.turn.passed.jens) return TM.turn.handOver();
        TM.turn.start();
      });
    },

    start: function () {
      TM.turn.active = 'jens';
      TM.turn.actionsDone = 0;
      TM.turn.renderBanner();
      TM.toast('Your turn again');
    },

    // Produktionsphase wie im Original: M€ = Produktion + TW, Energie wird zu Wärme
    endGeneration: function () {
      ['jens', 'mira'].forEach(function (id) {
        var player = TM.state[id];
        player.heat += player.energy + player.heatProduction;
        player.energy = player.energyProduction;
        player.megacredits += player.megacreditsProduction + player.tr;
        ['steel', 'titanium', 'plants'].forEach(function (resource) { player[resource] += player[resource + 'Production']; });
      });
      TM.state.game.generation += 1;
      TM.turn.passed = {jens: false, mira: false};
      TM.render();
      TM.log.generation(TM.state.game.generation);
      TM.toast('Production phase: +' + (TM.state.jens.megacreditsProduction + TM.state.jens.tr) + ' M€ – now buy cards');
      TM.emit('generation');
      TM.turn.active = 'jens';
      TM.turn.actionsDone = 0;
      TM.turn.renderBanner();
      TM.wait(900).then(function () { TM.tasks.open('research', {chained: true}); });
    },
  };

  TM.onClick('[data-pass]', function () { TM.turn.pass(); });
  TM.onClick('[data-skip]', function (button) { if (!button.disabled) TM.turn.skip(); });
})(window.TM);
