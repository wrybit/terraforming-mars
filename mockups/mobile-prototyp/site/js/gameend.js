// Spielende wie im Fork: schwebende Meldung über dem Mars, dann automatisch zur Ergebnisseite.
(function (TM) {
  'use strict';

  var REDIRECT_SECONDS = 5;
  var countdown;

  TM.gameEnd = {
    start: function () {
      // Letzter Stand: alle globalen Parameter erreicht
      TM.state.game.temperature = 8;
      TM.state.game.oxygen = 14;
      TM.state.game.oceans = 9;
      TM.state.game.over = true;
      TM.render();
      TM.turn.renderBanner();
      document.getElementById('turnTitle').textContent = 'Game over';
      TM.nav.go('mars');
      TM.gameEnd.showNotice();
    },

    showNotice: function () {
      var notice = document.getElementById('endNotice');
      var seconds = REDIRECT_SECONDS;
      notice.hidden = false;
      document.getElementById('endCountdown').textContent = seconds;
      clearInterval(countdown);
      countdown = setInterval(function () {
        seconds -= 1;
        document.getElementById('endCountdown').textContent = seconds;
        if (seconds <= 0) { clearInterval(countdown); TM.nav.go('results'); }
      }, 1000);
    },
  };

  // Auf dem Handy passt die breite Tabelle nicht: Wertungen als Zeilen, Spieler als Spalten.
  // Die Gruppen-Kopfzeile mit colspan fällt dabei weg, alle Zellen bleiben die echten.
  function transpose(table) {
    var rows = Array.prototype.slice.call(table.rows).filter(function (row) {
      return !Array.prototype.some.call(row.cells, function (cell) { return cell.colSpan > 1; });
    });
    // Spielerfarbe und Sieger-Markierung hingen an der Zeile – nach dem Drehen an jede Zelle der Spalte
    rows.forEach(function (row) {
      var colorClass = (row.className.match(/player_translucent_bg_color_\w+/) || [])[0];
      Array.prototype.forEach.call(row.cells, function (cell) {
        if (colorClass) cell.classList.add(colorClass, 'mb-player-col');
        if (row.classList.contains('game-end-winner-row')) cell.classList.add('mb-winner-col');
      });
    });
    var body = document.createElement('tbody');
    for (var column = 0; column < rows[0].cells.length; column++) {
      var line = document.createElement('tr');
      rows.forEach(function (row) { if (row.cells[column]) line.appendChild(row.cells[column].cloneNode(true)); });
      body.appendChild(line);
    }
    table.innerHTML = '';
    table.appendChild(body);
    table.classList.add('mb-transposed');
  }
  // Diagramme: echte Grafiken der Ergebnisseite, per Reiter umschaltbar
  TM.onClick('[data-chart-button]', function (button) {
    TM.$all('[data-chart-button]').forEach(function (other) { other.classList.toggle('is-active', other === button); });
    TM.$all('.mb-chart').forEach(function (chart) { chart.hidden = chart.dataset.chart !== button.dataset.chartButton; });
  });

  var resultTable = TM.$('.mb-results-scroll .game_end_table');
  if (resultTable) transpose(resultTable);

  TM.on('screen', function (screen) {
    if (screen !== 'results') return;
    clearInterval(countdown);
    document.getElementById('endNotice').hidden = true;
    document.getElementById('app').classList.add('is-results');
    TM.board.cloneInto(document.getElementById('boardFinal'));
  });
})(window.TM);
