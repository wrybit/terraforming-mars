// Nachbau der Bezahl-Leiste des Originals: Stahl/Titan frei wählbar, M€ ergibt den Rest.
(function (TM) {
  'use strict';

  var TAG_FOR = {steel: '.tag-building', titanium: '.tag-space'};

  function setLeadingText(element, text) {
    if (!element) return;
    if (element.firstChild && element.firstChild.nodeType === 3) element.firstChild.textContent = text;
    else element.insertBefore(document.createTextNode(text), element.firstChild);
  }

  TM.payment = {
    // area: Bereich mit den Zeilen (Taskbar oder Panel-Fuß); change: {row, delta} bei +/−
    update: function (card, area, change) {
      if (!card) return 0;
      var cost = TM.costOf(card);
      var rows = TM.$all('.payments_type', area);
      var paid = 0;
      rows.forEach(function (row) {
        var type = row.dataset.test;
        if (type === 'megacredits') return;
        var rate = Number(row.getAttribute('rate'));
        var input = row.querySelector('input');
        var usable = card.querySelector(TAG_FOR[type]) ? TM.get('jens.' + type) : 0;
        var limit = Math.min(usable, Math.ceil(cost / rate));
        var value = Number(input.value) || 0;
        if (change && change.row === row) value += change.delta;
        if (change && change.row !== row && change.row.dataset.test === 'megacredits') value -= change.delta; // M€ hoch heißt Stahl runter
        if (!change) value = limit; // wie das Original: Vorrat zuerst einsetzen
        value = Math.max(0, Math.min(limit, value));
        input.value = value;
        row.closest('tr').hidden = limit === 0;
        setLeadingText(row.closest('tr').querySelector('.payments_unit_subtotal'), ' = ' + value * rate + ' ');
        paid += value * rate;
      });
      var megacredits = Math.max(0, cost - paid);
      rows.forEach(function (row) {
        if (row.dataset.test !== 'megacredits') return;
        row.querySelector('input').value = megacredits;
        setLeadingText(row.closest('tr').querySelector('.payments_unit_subtotal'), ' = ' + megacredits + ' ');
      });
      setLeadingText(TM.$('.payments_total_value', area), Math.min(cost, paid + megacredits) + ' / ' + cost + ' ');
      setLeadingText(TM.$('.payments_single', area), cost + ' ');
      return megacredits;
    },

    // Was die aktuelle Eingabe an Rohstoffen verbraucht
    spent: function (area) {
      var result = {megacredits: 0, steel: 0, titanium: 0};
      TM.$all('.payments_type', area).forEach(function (row) {
        if (row.closest('tr').hidden) return;
        result[row.dataset.test] = Number(row.querySelector('input').value) || 0;
      });
      var single = TM.$('.payments_single', area);
      if (single) result.megacredits = parseInt(single.textContent, 10) || 0;
      return result;
    },
  };
})(window.TM);
