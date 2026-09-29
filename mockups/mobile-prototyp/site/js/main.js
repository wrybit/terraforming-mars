// Start: Module verdrahten und die gewählte Szene zeigen (#setup, #game, #end – sonst Szenenwahl).
(function (TM) {
  'use strict';

  // Im Handy-Rahmen der Teilen-Seite: Platz für Statusleiste und Kamera-Aussparung lassen
  var framed = false;
  try { framed = window.self !== window.top && window.top.innerWidth > 600; } catch (error) { framed = window.self !== window.top; }
  if (framed) document.getElementById('app').classList.add('is-framed');

  TM.board.init();
  TM.zoom.init();
  TM.actions.init();
  TM.marsView.init();
  TM.tasks.init();
  TM.carousel.init();

  var scene = location.hash.replace('#', '');
  document.getElementById('scenes').hidden = ['setup', 'game', 'end'].indexOf(scene) >= 0;

  if (scene === 'setup') {
    TM.setup.start();
  } else {
    TM.nav.go('mars');
    TM.render();
    TM.turn.renderBanner();
    if (scene === 'end') TM.gameEnd.start();
  }
  requestAnimationFrame(TM.board.fitAll);
})(window.TM);
