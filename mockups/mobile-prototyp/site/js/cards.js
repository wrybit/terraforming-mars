// Echte Karten: Auswahl in Aufgaben, Groß-Ansicht beim Antippen, Karten verschieben (Hand → gespielt).
(function (TM) {
  'use strict';

  var popover;

  // Auswahlzustand der Labels an die Inputs koppeln (Radio und Checkbox)
  TM.cards = {
    syncSelection: function (container) {
      TM.$all('label', container).forEach(function (label) {
        var input = label.querySelector('input');
        label.classList.toggle('mb-selected', !!(input && input.checked));
      });
    },

    // Alle Vorkommen einer Karte außerhalb der Ablagen entfernen (Hand, Bauen, Verkaufen)
    removeEverywhere: function (slug) {
      TM.$all('.card-' + slug).forEach(function (card) {
        if (card.closest('.mb-played') || card.closest('#popover')) return;
        var holder = card.closest('label') || card.closest('.cardbox') || card;
        holder.remove();
      });
    },

    // Karte in die eigene Ablage legen und Zähler nachführen
    addToPlayed: function (card, player) {
      var list = TM.$('.mb-player--' + (player === 'mira' ? 'red' : 'green') + ' .mb-played');
      var copy = card.cloneNode(true);
      copy.classList.remove('cardbox');
      list.appendChild(copy);
      var toggle = list.previousElementSibling;
      toggle.textContent = 'Played cards (' + list.querySelectorAll('.card-container').length + ')';
    },

    findByTitle: function (title) {
      var wanted = title.trim().toLowerCase();
      return TM.$all('.card-container').filter(function (card) {
        return !card.closest('#popover') && TM.titleOf(card).toLowerCase() === wanted;
      })[0];
    },

    setCounter: function (slug, delta) {
      TM.$all('.card-' + slug + ' .card-resources-counter-number').forEach(function (counter) {
        counter.textContent = Number(counter.textContent) + delta;
      });
    },

    // Groß-Ansicht mit passenden Schnellaktionen
    open: function (card) {
      popover = popover || document.getElementById('popover');
      var copy = card.cloneNode(true);
      copy.classList.remove('cardbox');
      var holder = document.getElementById('popoverCard');
      holder.innerHTML = '';
      holder.appendChild(copy);
      var slug = TM.slugOf(card);
      var actions = [];
      var yourTurn = TM.turn && TM.turn.canAct();
      if (yourTurn && TM.$('.mb-panel[data-key="build"] .card-' + slug)) actions.push('<button type="button" class="btn btn-submit btn-rounded" data-popover-task="build" data-slug="' + slug + '">Play card</button>');
      if (yourTurn && TM.$('.mb-panel[data-key="actions"] label:not(.mb-used) .card-' + slug)) actions.push('<button type="button" class="btn btn-submit btn-rounded" data-popover-task="actions" data-slug="' + slug + '">Use action</button>');
      actions.push('<button type="button" class="mb-taskbar-cancel" data-close-popover>Close</button>');
      document.getElementById('popoverActions').innerHTML = actions.join('');
      popover.hidden = false;
    },

    close: function () { if (popover) popover.hidden = true; },
  };

  TM.onClick('[data-close-popover]', function () { TM.cards.close(); });
  TM.onClick('[data-popover-task]', function (button) {
    TM.cards.close();
    TM.tasks.open(button.dataset.popoverTask, {preselect: button.dataset.slug});
  });

  // Antippen einer Karte außerhalb einer Auswahl öffnet die Groß-Ansicht
  TM.onClick('.mb-screen[data-screen="hand"] .card-container, .mb-played .card-container', function (card) {
    TM.cards.open(card);
  });
  TM.onClick('.log-card', function (chip) {
    var card = TM.cards.findByTitle(chip.textContent);
    if (card) TM.cards.open(card);
    else TM.toast(chip.textContent + ' – card is not visible to you');
  });

  document.addEventListener('change', function (event) {
    var container = event.target.closest('.mb-panel, .mb-setup');
    // Die abgegriffenen Radios haben keinen gemeinsamen name – Einzelwahl daher hier herstellen
    if (container && event.target.type === 'radio' && event.target.checked) {
      TM.$all('input[type="radio"]', container).forEach(function (other) { if (other !== event.target) other.checked = false; });
    }
    if (container) {
      TM.cards.syncSelection(container);
      TM.emit('selection', container);
    }
  });
})(window.TM);
