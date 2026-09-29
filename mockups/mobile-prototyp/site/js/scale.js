// Echte Karten und Wertungs-Kacheln verkleinern, ohne CSS-zoom: Browser rechnen zoom im Raster
// unterschiedlich (Safari/Electron ließen Karten überlappen). Stattdessen transform: scale()
// plus ein Halter, der die verkleinerte Größe ins Layout einträgt.
(function (TM) {
  'use strict';

  // Reihenfolge zählt: die erste passende Regel gewinnt
  var RULES = [
    {selector: '.mb-popover-card .card-container', scale: 1.2},
    {selector: '.mb-setup[data-step="corporation"] .card-container', scale: 0.9},
    {selector: '.mb-panel[data-key="build"] .card-container', scale: 1},
    {selector: '.card-container', scale: 'two-columns', within: '.mb-screen[data-screen="hand"], .mb-panel, .mb-played, .mb-setup'},
    {selector: '.mb-ma-slot .ma-block', scale: 0.8, wrap: true},
  ];

  function holderOf(element, wrap) {
    // Eigener Halter nötig, wenn das Element Geschwister hat (z. B. Ablage mit vielen Karten)
    var siblings = Array.prototype.filter.call(element.parentElement.children, function (child) { return child.tagName !== 'INPUT'; });
    if (!wrap && siblings.length === 1) return element.parentElement;
    if (element.parentElement.classList.contains('mb-scale-holder')) return element.parentElement;
    var holder = document.createElement('span');
    holder.className = 'mb-scale-holder';
    element.parentElement.insertBefore(holder, element);
    holder.appendChild(element);
    return holder;
  }

  // Zwei Karten nebeneinander über die volle Breite des Rasters (abzüglich Innenabstand und Spaltenlücke)
  function twoColumnScale(holder, width) {
    var grid = holder.parentElement;
    while (grid && getComputedStyle(grid).display !== 'grid') grid = grid.parentElement;
    if (!grid) return 0.62;
    var style = getComputedStyle(grid);
    var inner = grid.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - parseFloat(style.columnGap || 0);
    return Math.min(1, inner / 2 / width);
  }

  function apply(element, rule) {
    if (!element.offsetParent && element.offsetWidth === 0) return; // unsichtbar: später messen
    var holder = holderOf(element, rule.wrap);
    element.style.transform = '';
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (!width) return;
    var scale = rule.scale === 'two-columns' ? twoColumnScale(holder, width) : rule.scale;
    rule = {scale: scale};
    holder.classList.add('mb-scaled');
    holder.style.width = Math.round(width * rule.scale) + 'px';
    holder.style.height = Math.round(height * rule.scale) + 'px';
    element.style.transform = rule.scale === 1 ? '' : 'scale(' + rule.scale + ')';
    element.classList.toggle('mb-scaled-item', rule.scale !== 1);
  }

  TM.scale = {
    visible: function () {
      var done = new Set();
      RULES.forEach(function (rule) {
        TM.$all(rule.selector).forEach(function (element) {
          if (done.has(element)) return;
          if (rule.within && !element.closest(rule.within)) return;
          done.add(element);
          apply(element, rule);
        });
      });
    },
  };

  // Nach jedem Klick und jeder Größenänderung neu messen: Bildschirme, Aufgaben und Ablagen
  // werden erst dann sichtbar, vorher haben die Elemente keine Maße
  function schedule() { requestAnimationFrame(function () { requestAnimationFrame(TM.scale.visible); }); }
  document.addEventListener('click', schedule);
  document.addEventListener('change', schedule);
  window.addEventListener('resize', schedule);
  TM.on('screen', schedule);
  window.addEventListener('load', schedule);
})(window.TM);
