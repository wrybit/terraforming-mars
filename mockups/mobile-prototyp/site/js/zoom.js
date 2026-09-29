// Zoombarer Mars beim Platzieren: Pinch mit zwei Fingern, Trackpad-Pinch (Strg+Rad),
// Doppel-Tap und +/− Knöpfe. Start so, dass die wählbaren Felder den Ausschnitt füllen.
(function (TM) {
  'use strict';

  var CROP = {left: 84, top: 78, width: 466, height: 464}; // Planet in .board-cont-Koordinaten
  var MIN_LEVEL = 1;
  var MAX_LEVEL = 3.2;

  var viewport;
  var stage;
  var board;
  var level = 1;
  var baseZoom = 1;

  function zoomFactor() { return baseZoom * level; }

  // Größe der Bühne und Zoom der Karte setzen; Karte liegt mit negativem Versatz auf dem Planeten
  function applyLevel() {
    var zoom = zoomFactor();
    board.style.zoom = zoom;
    board.style.left = -CROP.left + 'px';
    board.style.top = -CROP.top + 'px';
    stage.style.width = Math.round(CROP.width * zoom) + 'px';
    stage.style.height = Math.round(CROP.height * zoom) + 'px';
    TM.$('[data-zoom-level]').textContent = Math.round(level * 100) + ' %';
  }

  // Zoomen um einen Punkt im Ausschnitt (clientX/Y), damit dieser Punkt unter dem Finger bleibt
  function zoomTo(newLevel, clientX, clientY) {
    newLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, newLevel));
    var rect = viewport.getBoundingClientRect();
    var focusX = (clientX === undefined ? rect.width / 2 : clientX - rect.left);
    var focusY = (clientY === undefined ? rect.height / 2 : clientY - rect.top);
    var contentX = (viewport.scrollLeft + focusX) / level;
    var contentY = (viewport.scrollTop + focusY) / level;
    level = newLevel;
    applyLevel();
    viewport.scrollLeft = contentX * level - focusX;
    viewport.scrollTop = contentY * level - focusY;
  }

  // Start: Ausschnitt auf die markierten Felder, so groß wie möglich
  function focusAvailable() {
    var spaces = TM.$all('.board-space--available', board);
    if (!spaces.length) return;
    var stageRect = stage.getBoundingClientRect();
    var box = spaces.reduce(function (bounds, space) {
      var rect = space.getBoundingClientRect();
      return {
        left: Math.min(bounds.left, rect.left), top: Math.min(bounds.top, rect.top),
        right: Math.max(bounds.right, rect.right), bottom: Math.max(bounds.bottom, rect.bottom),
      };
    }, {left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity});
    var width = (box.right - box.left) / level;
    var height = (box.bottom - box.top) / level;
    var fitLevel = Math.min(viewport.clientWidth / (width + 40), viewport.clientHeight / (height + 40));
    var centerX = ((box.left + box.right) / 2 - stageRect.left) / level;
    var centerY = ((box.top + box.bottom) / 2 - stageRect.top) / level;
    level = Math.max(MIN_LEVEL, Math.min(2.2, fitLevel));
    applyLevel();
    viewport.scrollLeft = centerX * level - viewport.clientWidth / 2;
    viewport.scrollTop = centerY * level - viewport.clientHeight / 2;
  }

  TM.zoom = {
    init: function () {
      viewport = document.getElementById('boardPlace');
      stage = TM.$('.mb-zoom-stage', viewport);
      bindGestures();
    },

    // Karte in die Bühne holen und auf die markierten Felder zoomen
    start: function (boardElement) {
      board = boardElement;
      stage.appendChild(board);
      level = 1;
      // Erst nach dem Layout messen: Höhe = restlicher Platz bis zum Footer, abzüglich Zoom-Leiste
      requestAnimationFrame(function () {
        var screen = viewport.closest('.mb-screen');
        var controls = TM.$('.mb-zoom-controls');
        var top = viewport.getBoundingClientRect().top - screen.getBoundingClientRect().top + screen.scrollTop;
        viewport.style.height = Math.max(280, screen.clientHeight - top - controls.offsetHeight - 20) + 'px';
        TM.zoom.fit();
        focusAvailable();
      });
    },

    fit: function () {
      if (!board || !board.closest('#boardPlace')) return;
      // 100 % = ganzer Planet sichtbar, egal ob der Ausschnitt schmal oder niedrig ist
      baseZoom = Math.min(viewport.clientWidth / CROP.width, viewport.clientHeight / CROP.height);
      applyLevel();
    },
  };

  function bindGestures() {
    var pinch = null;
    var lastTap = 0;
    function distance(touches) { return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY); }
    function middle(touches) { return {x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2}; }

    viewport.addEventListener('touchstart', function (event) {
      if (event.touches.length === 2) pinch = {distance: distance(event.touches), level: level};
    }, {passive: true});
    viewport.addEventListener('touchmove', function (event) {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault(); // eigenes Zoomen statt Seiten-Zoom
      var center = middle(event.touches);
      zoomTo(pinch.level * distance(event.touches) / pinch.distance, center.x, center.y);
    }, {passive: false});
    viewport.addEventListener('touchend', function (event) {
      if (event.touches.length < 2) pinch = null;
      // Doppel-Tap: stufenweise näher, am Maximum zurück auf ganz
      if (event.changedTouches.length === 1 && event.touches.length === 0) {
        var now = Date.now();
        if (now - lastTap < 300) {
          var touch = event.changedTouches[0];
          zoomTo(level >= MAX_LEVEL - 0.01 ? MIN_LEVEL : level * 1.6, touch.clientX, touch.clientY);
          lastTap = 0;
        } else {
          lastTap = now;
        }
      }
    });
    // Trackpad-Pinch kommt im Browser als Rad mit Strg-Taste
    viewport.addEventListener('wheel', function (event) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoomTo(level * Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
    }, {passive: false});
  }

  TM.onClick('[data-zoom]', function (button) {
    var step = button.dataset.zoom;
    if (step === 'fit') zoomTo(MIN_LEVEL);
    else zoomTo(level * (step === 'in' ? 1.4 : 1 / 1.4));
  });
})(window.TM);
