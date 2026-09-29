// Aufgaben-Modus: Eine Aktion füllt den Bildschirm, ihr Bestätigen/Bezahlen wandert in den Footer.
// Aktionen melden sich mit TM.tasks.define an; eine Aktion kann eine Folge-Aufgabe anhängen (z. B. Stadt platzieren).
(function (TM) {
  'use strict';

  var app = document.getElementById('app');
  var taskbar = document.getElementById('taskbar');
  var slot = document.getElementById('taskbarSlot');
  var extra = document.getElementById('taskbarExtra');
  var definitions = {};
  var footers = {};
  var current = null;
  var pendingMessages = [];

  function panelOf(key) { return TM.$('.mb-panel[data-key="' + key + '"]'); }
  function selectedCard(panel) { var label = TM.$('label.mb-selected', panel); return label && label.querySelector('.card-container'); }

  TM.tasks = {
    init: function () {
      TM.$all('.mb-panel').forEach(function (panel) { footers[panel.dataset.key] = panel.querySelector('.or-tab-footer'); });
    },

    define: function (key, definition) { definitions[key] = definition; },
    current: function () { return current && current.key; },
    panel: function () { return current && panelOf(current.key); },
    selectedCard: function () { return current && selectedCard(panelOf(current.key)); },
    confirmButton: function () { return TM.$('.btn-submit, [data-task-confirm]', slot); },

    open: function (key, options) {
      options = options || {};
      var panel = panelOf(key);
      var definition = definitions[key] || {};
      current = {key: key, options: options};
      TM.nav.closeSheet();
      TM.$all('.mb-panel').forEach(function (element) { element.classList.toggle('is-active', element === panel); });
      document.getElementById('taskTitle').textContent = options.title || panel.dataset.title;
      var tone = panel.dataset.tone;
      var colored = ['success', 'heat', 'city', 'ocean'].indexOf(tone) >= 0;
      document.getElementById('taskSub').textContent = colored ? '' : panel.dataset.sub;
      document.getElementById('taskHead').className = 'mb-task-head' + (colored ? ' mb-task-head--' + tone : '');

      slot.innerHTML = '';
      extra.innerHTML = '';
      var footer = footers[key];
      if (footer) {
        slot.appendChild(footer);
        var payment = footer.querySelector('.payments_form');
        if (payment) extra.appendChild(payment);
      }
      if (definition.place) {
        var confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'btn btn-submit btn-rounded mb-confirm';
        confirm.dataset.taskConfirm = '';
        confirm.textContent = 'Select a space';
        confirm.disabled = true;
        slot.appendChild(confirm);
        TM.board.startPlacing(definition.place);
      }
      // Nur Ansehen (Mars zoomen): kein Platzieren, Footer hat nur „Close“
      if (definition.view) TM.board.startViewing();
      TM.$('.mb-taskbar-cancel', taskbar).textContent = definition.view ? 'Close' : 'Cancel';
      TM.$('.mb-taskbar-cancel', taskbar).hidden = !!options.chained;

      // Vorauswahl wie im Original (erste Karte) oder gezielt aus der Groß-Ansicht
      var inputs = TM.$all('label input', panel);
      if (options.preselect) {
        inputs.forEach(function (input) { input.checked = !!input.closest('label').querySelector('.card-' + options.preselect); });
      } else if (definition.preselectFirst && inputs.length && !inputs.some(function (input) { return input.checked; })) {
        inputs[0].checked = true;
      }
      TM.cards.syncSelection(panel);

      app.classList.add('is-task');
      app.dataset.screen = 'task';
      TM.$all('.mb-screen').forEach(function (element) { element.classList.toggle('is-active', element.dataset.screen === 'task'); });
      if (definition.open) definition.open(panel, options);
      TM.tasks.refresh();
      var chosen = TM.$('label.mb-selected', panel);
      if (chosen) requestAnimationFrame(function () { chosen.scrollIntoView({inline: 'center', block: 'nearest'}); });
    },

    // Fußleiste an die aktuelle Auswahl anpassen (Preis, Knopftext, gesperrt/frei)
    refresh: function (change) {
      if (!current) return;
      var panel = panelOf(current.key);
      var definition = definitions[current.key] || {};
      if (TM.$('.payments_type, .payments_single', taskbar)) TM.payment.update(selectedCard(panel), taskbar, change);
      if (definition.refresh) definition.refresh(panel, TM.tasks.confirmButton(), current.options);
    },

    close: function (reopenSheet) {
      if (!current) return;
      var key = current.key;
      var footer = footers[key];
      if (footer) {
        var payment = TM.$('.payments_form', extra);
        if (payment) footer.appendChild(payment);
        panelOf(key).querySelector('.or-tab-panel').appendChild(footer);
      }
      var closing = definitions[key] || {};
      if (closing.place || closing.view) TM.board.stopPlacing();
      if (closing.view) reopenSheet = false;
      current = null;
      app.classList.remove('is-task');
      TM.nav.go('mars');
      if (reopenSheet) TM.nav.openSheet();
    },

    confirm: function () {
      if (!current) return;
      var definition = definitions[current.key] || {};
      var result = definition.confirm ? definition.confirm(panelOf(current.key), current.options) : {message: 'Done'};
      if (!result) return;
      pendingMessages.push(result.message);
      TM.tasks.close(false);
      if (result.chain) {
        TM.tasks.open(result.chain.key, Object.assign({chained: true}, result.chain.options));
        return;
      }
      var message = pendingMessages.filter(Boolean).join(' · ');
      pendingMessages = [];
      TM.turn.actionDone(message, result);
    },
  };

  TM.onClick('[data-task]', function (tile) { TM.tasks.open(tile.dataset.task); });
  TM.onClick('[data-cancel]', function () { TM.tasks.close(true); });
  TM.onClick('.mb-taskbar .btn-submit, .mb-taskbar [data-task-confirm]', function (button, event) {
    event.preventDefault();
    if (!button.disabled) TM.tasks.confirm();
  });
  TM.onClick('.mb-taskbar .btn-minus, .mb-taskbar .btn-plus', function (stepper) {
    TM.tasks.refresh({row: stepper.closest('.payments_type'), delta: stepper.classList.contains('btn-plus') ? 1 : -1});
  });
  TM.on('selection', function (container) { if (current && container === panelOf(current.key)) TM.tasks.refresh(); });
  TM.on('space-picked', function () {
    var button = TM.tasks.confirmButton();
    if (!button) return;
    button.disabled = false;
    button.textContent = (definitions[current.key] || {}).confirmLabel || 'Place here';
  });
})(window.TM);
