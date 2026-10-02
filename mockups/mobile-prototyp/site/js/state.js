// Game state of the prototype and its display. Every number in the DOM with data-value="path" is kept in sync here.
(function (TM) {
  'use strict';

  var data = window.TM_DATA;
  TM.state = {
    game: Object.assign({claimedMilestones: 0, fundedAwards: 0}, data.game),
    jens: Object.assign({}, data.players.jens),
    mira: Object.assign({}, data.players.mira),
  };

  TM.get = function (path) {
    return path.split('.').reduce(function (value, key) { return value == null ? value : value[key]; }, TM.state);
  };

  TM.set = function (path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    keys.reduce(function (object, key) { return object[key]; }, TM.state)[last] = value;
    TM.render();
  };

  TM.add = function (path, delta) { TM.set(path, TM.get(path) + delta); };

  // Several changes at once, e.g. {'jens.plants': -8, 'game.oxygen': 1}
  TM.change = function (deltas) {
    Object.keys(deltas).forEach(function (path) {
      var keys = path.split('.');
      var last = keys.pop();
      var object = keys.reduce(function (target, key) { return target[key]; }, TM.state);
      object[last] += deltas[path];
    });
    TM.render();
  };

  TM.render = function () {
    TM.$all('[data-value]').forEach(function (element) {
      var path = element.dataset.value;
      var value = TM.get(path);
      if (value == null) return;
      var prefix = element.dataset.prefix || (/Production$/.test(path) && value >= 0 ? '+' : '');
      element.textContent = prefix + value + (element.dataset.suffix || '');
    });
    TM.emit('state');
  };
})(window.TM);
