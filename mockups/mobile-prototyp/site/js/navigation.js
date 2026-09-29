// Bildschirme, Zug-Menü, Reiter der Spielerseite und Szenenwahl.
(function (TM) {
  'use strict';

  var app = document.getElementById('app');

  TM.nav = {
    current: 'mars',

    go: function (screen) {
      TM.nav.current = screen;
      TM.$all('.mb-screen').forEach(function (element) { element.classList.toggle('is-active', element.dataset.screen === screen); });
      TM.$all('.mb-nav-item[data-go]').forEach(function (item) { item.classList.toggle('is-active', item.dataset.go === screen); });
      app.dataset.screen = screen;
      TM.nav.closeSheet();
      TM.emit('screen', screen);
      requestAnimationFrame(TM.board.fitAll);
    },

    segment: function (name) {
      TM.$all('[data-segment-button]').forEach(function (button) { button.classList.toggle('is-active', button.dataset.segmentButton === name); });
      TM.$all('[data-segment-view]').forEach(function (view) { view.hidden = view.dataset.segmentView !== name; });
    },

    openSheet: function () {
      if (!TM.turn.canAct()) { TM.toast(TM.turn.waitingText()); return; }
      document.getElementById('sheet').classList.add('is-open');
    },
    closeSheet: function () { document.getElementById('sheet').classList.remove('is-open'); },

    openScenes: function () { document.getElementById('scenes').hidden = false; },
  };

  TM.onClick('[data-go]', function (button) {
    if (TM.tasks.current()) TM.tasks.close(false);
    TM.nav.go(button.dataset.go);
    TM.nav.segment(button.dataset.segment || 'players');
  });
  TM.onClick('[data-open-sheet]', function () { TM.nav.openSheet(); });
  TM.onClick('[data-close-sheet]', function () { TM.nav.closeSheet(); });
  TM.onClick('[data-segment-button]', function (button) { TM.nav.segment(button.dataset.segmentButton); });
  TM.onClick('[data-played-toggle]', function (toggle) { toggle.nextElementSibling.classList.toggle('is-open'); });
  TM.onClick('[data-open-scenes]', function () { TM.nav.openScenes(); });
  TM.onClick('[data-scene]', function (button) {
    // Szenen starten jeweils mit frischem Spielstand: neu laden mit Anker
    location.hash = button.dataset.scene;
    location.reload();
  });
})(window.TM);
