// Start: wire up modules and show the chosen scene (#setup, #game, #end – otherwise scene selection).
(function (TM) {
  'use strict';

  // Inside the share page's phone frame: leave room for the status bar and camera notch
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
