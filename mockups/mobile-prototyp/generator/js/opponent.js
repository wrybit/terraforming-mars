// Miras Züge als festes Drehbuch mit Karten aus ihrer echten Hand (Teractor, Generation 6).
(function (TM) {
  'use strict';

  var MOVE_DELAY = 1100;
  var SCRIPT = [
    [
      {card: 'Deep Well Heating', kind: 'automated', cost: 13, change: {'mira.energyProduction': 1}, temperature: 1},
      {standard: 'City', cost: 25, change: {'mira.megacreditsProduction': 1}, tile: 'city'},
    ],
    // Danach hat Mira nur noch 3 M€ – sie passt
    [{pass: true}],
  ];
  var turnIndex = 0;

  function perform(move) {
    if (move.pass) {
      TM.turn.passed.mira = true;
      TM.log([{player: 'mira'}, {text: ' passed'}]);
      TM.toast('Mira passed');
      return;
    }
    TM.add('mira.megacredits', -move.cost);
    if (move.change) TM.change(move.change);
    var text = move.card ? 'Mira played ' + move.card : 'Mira built a ' + move.standard;
    if (move.temperature) {
      TM.raise('temperature', move.temperature, 'mira');
      text += ' · temperature ' + TM.state.game.temperature + ' °C';
    }
    if (move.tile) {
      var free = TM.board.freeSpaces(move.tile);
      if (free.length) TM.board.placeTile(free[free.length - 1], move.tile, 'red');
    }
    if (move.card) {
      TM.add('mira.cards', -1);
      TM.log([{player: 'mira'}, {text: ' played '}, {card: move.card, kind: move.kind}]);
    } else {
      TM.log([{player: 'mira'}, {text: ' used the standard project '}, {card: move.standard, kind: 'automated'}]);
    }
    TM.toast(text);
  }

  TM.opponent = {
    // Spielt Miras nächsten Zug; Rückgabe erst, wenn alle Aktionen gezeigt wurden
    play: function () {
      var moves = TM.turn.passed.mira ? [] : (SCRIPT[turnIndex++] || [{pass: true}]);
      return moves.reduce(function (chain, move) {
        return chain.then(function () { return TM.wait(MOVE_DELAY); }).then(function () { perform(move); });
      }, Promise.resolve()).then(function () { return TM.wait(MOVE_DELAY); });
    },
  };
})(window.TM);
