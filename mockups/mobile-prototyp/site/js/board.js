// Real Mars without ring: cut-out planet, colony spaces in the corners, global parameters as bars.
(function (TM) {
  'use strict';

  // Crops in coordinates of .board-cont (670 px wide, planet at x 92–541, y 85–534)
  var CROP_HOME = {left: 42, top: 62, width: 550, height: 486};
  var TILE_TITLES = {
    greenery: 'Greenery: 1 VP',
    city: 'City: 1 VP per adjacent greenery',
    ocean: 'Ocean: a player gets 2 M€ when placing a tile next to it',
  };

  var board;
  var available = {};
  var placing = null;

  function fit(container, crop) {
    if (!container || !container.firstElementChild) return;
    var element = container.firstElementChild;
    var zoom = container.clientWidth / crop.width;
    element.style.zoom = zoom;
    element.style.left = -crop.left + 'px';
    element.style.top = -crop.top + 'px';
    container.style.height = Math.round(crop.height * zoom) + 'px';
  }

  TM.board = {
    init: function () {
      board = TM.$('#boardHome .board-cont');
      // Remember selectable spaces per tile type; show them neutral outside of placing
      available = JSON.parse(JSON.stringify(window.TM_DATA.available));
      TM.$all('.board-space--available', board).forEach(function (space) { space.classList.remove('board-space--available'); });
      TM.on('state', TM.board.renderParameters);
      window.addEventListener('resize', TM.board.fitAll);
    },

    fitAll: function () {
      fit(document.getElementById('boardHome'), CROP_HOME);
      if (TM.zoom) TM.zoom.fit();
      fit(document.getElementById('boardFinal'), CROP_HOME);
    },

    renderParameters: function () {
      TM.$all('.mb-param').forEach(function (bar) {
        var min = Number(bar.dataset.min);
        var max = Number(bar.dataset.max);
        var value = TM.get('game.' + bar.dataset.param);
        var share = (value - min) / (max - min) * 100;
        bar.querySelector('[data-param-fill]').style.width = share + '%';
        bar.querySelector('[data-param-value]').textContent = value + bar.dataset.unit;
        bar.classList.toggle('is-complete', value >= max);
        TM.$all('.mb-param-bonus', bar).forEach(function (bonus) {
          bonus.classList.toggle('is-reached', parseFloat(bonus.style.left) <= share + 0.01);
        });
      });
    },

    // Free spaces for a tile type (already occupied ones drop out)
    freeSpaces: function (type) {
      return available[type].filter(function (id) {
        var space = TM.$('.board-space[data_space_id="' + id + '"]', board);
        return space && !space.querySelector('[class*="board-space-tile--"]');
      });
    },

    startPlacing: function (type) {
      placing = type;
      document.getElementById('placeWrap').hidden = false;
      TM.board.freeSpaces(type).forEach(function (id) {
        TM.$('.board-space[data_space_id="' + id + '"]', board).classList.add('board-space--available');
      });
      TM.zoom.start(board);
    },

    // Only view and zoom Mars, without selectable spaces
    startViewing: function () {
      placing = null;
      document.getElementById('placeWrap').hidden = false;
      TM.zoom.start(board);
    },

    stopPlacing: function () {
      placing = null;
      TM.$all('.board-space--available, .mb-picked', board).forEach(function (space) {
        space.classList.remove('board-space--available', 'mb-picked');
      });
      document.getElementById('boardHome').appendChild(board);
      document.getElementById('placeWrap').hidden = true;
      requestAnimationFrame(TM.board.fitAll);
    },

    pick: function (space) {
      TM.$all('.mb-picked', board).forEach(function (other) { other.classList.remove('mb-picked'); });
      space.classList.add('mb-picked');
      TM.emit('space-picked', space.getAttribute('data_space_id'));
    },

    pickedSpace: function () {
      var space = TM.$('.mb-picked', board);
      return space ? space.getAttribute('data_space_id') : null;
    },

    // Place tiles the way the real client renders them: tile class plus player cube
    placeTile: function (spaceId, type, color) {
      var space = TM.$('.board-space[data_space_id="' + spaceId + '"]', board);
      var tile = space.querySelector('.board-space');
      tile.className = 'board-space board-space-tile--' + type;
      tile.title = TILE_TITLES[type];
      var bonuses = space.querySelector('.board-space-bonuses');
      if (bonuses) bonuses.innerHTML = '';
      if (color && type !== 'ocean') space.insertAdjacentHTML('beforeend', '<div class="board-cube board-cube--' + color + '"></div>');
      space.classList.add('mb-just-placed');
      setTimeout(function () { space.classList.remove('mb-just-placed'); }, 1600);
    },

    // For the results page: current state as a copy
    cloneInto: function (container) {
      container.innerHTML = '';
      var copy = board.cloneNode(true);
      TM.$all('.board-space--available, .mb-picked', copy).forEach(function (space) { space.classList.remove('board-space--available', 'mb-picked'); });
      container.appendChild(copy);
      requestAnimationFrame(TM.board.fitAll);
    },

    isPlacing: function () { return placing; },
  };

  TM.onClick('.board-space--available', function (space) {
    if (!placing) return false;
    TM.board.pick(space);
  });
})(window.TM);
