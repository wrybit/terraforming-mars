// Gemeinsame Werkzeuge aller Prototyp-Module: Namensraum, DOM-Helfer, Ereignisse, Meldung.
// Jedes Modul hängt sich an window.TM, damit die Dateien ohne Bundler nacheinander laden können.
window.TM = window.TM || {};
(function (TM) {
  'use strict';

  TM.$ = function (selector, root) { return (root || document).querySelector(selector); };
  TM.$all = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  TM.wait = function (milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, milliseconds); }); };

  // Einfache Ereignisse zwischen Modulen, damit kein Modul die anderen direkt kennen muss
  var listeners = {};
  TM.on = function (name, listener) { (listeners[name] = listeners[name] || []).push(listener); };
  TM.emit = function (name, detail) { (listeners[name] || []).forEach(function (listener) { listener(detail); }); };

  // Eine zentrale Klick-Weiche: Module melden Selektor + Handler an, der erste passende gewinnt.
  // Gibt ein Handler false zurück, gilt der Klick als nicht behandelt und die Suche läuft weiter.
  var clickHandlers = [];
  TM.onClick = function (selector, handler) { clickHandlers.push({selector: selector, handler: handler}); };
  document.addEventListener('click', function (event) {
    for (var index = 0; index < clickHandlers.length; index++) {
      var target = event.target.closest(clickHandlers[index].selector);
      if (target && clickHandlers[index].handler(target, event) !== false) return;
    }
  });

  // Kartenname aus der CSS-Klasse card-<slug> der echten Karten
  TM.slugOf = function (card) {
    var classes = card.className.match(/card-([a-z0-9-]+)/g) || [];
    return classes.length ? classes[classes.length - 1].slice(5) : '';
  };
  // Sichtbarer (übersetzter) Titel einer echten Karte
  TM.titleOf = function (card) {
    var titles = card.querySelectorAll('.card-title');
    return titles.length ? titles[titles.length - 1].textContent.trim() : '';
  };

  // Preis einer echten Karte; Standardprojekte zeigen ihn als M€-Symbol statt im Kosten-Feld
  TM.costOf = function (card) {
    var cost = card.querySelector('.card-cost') || card.querySelector('.card-resource-money');
    return cost ? Number(cost.textContent.trim()) : 0;
  };

  var toastElement;
  var toastTimer;
  TM.toast = function (text) {
    toastElement = toastElement || document.getElementById('toast');
    toastElement.textContent = text;
    toastElement.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastElement.classList.remove('is-visible'); }, 2800);
  };
})(window.TM);
