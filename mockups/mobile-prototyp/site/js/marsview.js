// Mars groß ansehen: Antippen des Mars auf dem Startbildschirm öffnet ihn zoombar im Aufgaben-Modus.
(function (TM) {
  'use strict';

  function buildPanel() {
    var panel = document.createElement('div');
    panel.className = 'mb-panel';
    panel.dataset.key = 'view-mars';
    panel.dataset.title = 'Mars';
    panel.dataset.sub = 'Pinch or double-tap to zoom';
    panel.dataset.tone = '';
    panel.innerHTML = '<div class="or-tab-panel"></div>';
    TM.$('.mb-task-body').insertBefore(panel, document.getElementById('placeWrap'));
  }

  TM.marsView = { init: buildPanel };
  TM.tasks.define('view-mars', {view: true});

  // Klick auf den kleinen Mars (nicht auf den Kacheln-Schalter) öffnet die Groß-Ansicht
  TM.onClick('#boardHome, [data-open-mars]', function (target, event) {
    if (event.target.closest('.hide-tile-button')) return false;
    TM.tasks.open('view-mars');
  });
})(window.TM);
