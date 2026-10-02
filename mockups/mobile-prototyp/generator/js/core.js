// Shared tools of all prototype modules: namespace, DOM helpers, events, notice.
// Each module attaches itself to window.TM, so the files can load one after another without a bundler.
window.TM = window.TM || {};
(function (TM) {
  'use strict';

  TM.$ = function (selector, root) { return (root || document).querySelector(selector); };
  TM.$all = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  TM.wait = function (milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, milliseconds); }); };

  // Simple events between modules, so no module has to know the others directly
  var listeners = {};
  TM.on = function (name, listener) { (listeners[name] = listeners[name] || []).push(listener); };
  TM.emit = function (name, detail) { (listeners[name] || []).forEach(function (listener) { listener(detail); }); };

  // One central click switch: modules register selector + handler, the first match wins.
  // If a handler returns false, the click counts as unhandled and the search continues.
  var clickHandlers = [];
  TM.onClick = function (selector, handler) { clickHandlers.push({selector: selector, handler: handler}); };
  document.addEventListener('click', function (event) {
    for (var index = 0; index < clickHandlers.length; index++) {
      var target = event.target.closest(clickHandlers[index].selector);
      if (target && clickHandlers[index].handler(target, event) !== false) return;
    }
  });

  // Card name from the CSS class card-<slug> of the real cards
  TM.slugOf = function (card) {
    var classes = card.className.match(/card-([a-z0-9-]+)/g) || [];
    return classes.length ? classes[classes.length - 1].slice(5) : '';
  };
  // Visible (translated) title of a real card
  TM.titleOf = function (card) {
    var titles = card.querySelectorAll('.card-title');
    return titles.length ? titles[titles.length - 1].textContent.trim() : '';
  };

  // Price of a real card; standard projects show it as an M€ symbol instead of in the cost field
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
