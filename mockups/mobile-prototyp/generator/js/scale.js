// Scale down real cards and scoring tiles without CSS zoom: browsers compute zoom in a grid
// differently (Safari/Electron let cards overlap). Instead transform: scale()
// plus a holder that puts the scaled-down size into the layout.
(function (TM) {
  'use strict';

  // Order matters: the first matching rule wins
  var RULES = [
    {selector: '.mb-popover-card .card-container', scale: 1.2},
    {selector: '.mb-setup[data-step="corporation"] .card-container', scale: 0.9},
    {selector: '.mb-panel[data-key="build"] .card-container', scale: 1},
    {selector: '.card-container', scale: 'two-columns', within: '.mb-screen[data-screen="hand"], .mb-panel, .mb-played, .mb-setup'},
    {selector: '.mb-ma-slot .ma-block', scale: 0.8, wrap: true},
  ];

  function holderOf(element, wrap) {
    // Own holder needed if the element has siblings (e.g. a pile with many cards)
    var siblings = Array.prototype.filter.call(element.parentElement.children, function (child) { return child.tagName !== 'INPUT'; });
    if (!wrap && siblings.length === 1) return element.parentElement;
    if (element.parentElement.classList.contains('mb-scale-holder')) return element.parentElement;
    var holder = document.createElement('span');
    holder.className = 'mb-scale-holder';
    element.parentElement.insertBefore(holder, element);
    holder.appendChild(element);
    return holder;
  }

  // Two cards side by side across the full width of the grid (minus padding and column gap)
  function twoColumnScale(holder, width) {
    var grid = holder.parentElement;
    while (grid && getComputedStyle(grid).display !== 'grid') grid = grid.parentElement;
    if (!grid) return 0.62;
    var style = getComputedStyle(grid);
    var inner = grid.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - parseFloat(style.columnGap || 0);
    return Math.min(1, inner / 2 / width);
  }

  function apply(element, rule) {
    if (!element.offsetParent && element.offsetWidth === 0) return; // invisible: measure later
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
    // Copy of an element without its scaling; the copy is rescaled on the next measurement
    fresh: function (element) {
      var copy = element.cloneNode(true);
      copy.style.transform = '';
      copy.classList.remove('mb-scaled-item');
      TM.scale.soon();
      return copy;
    },
    soon: function () { schedule(); },
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

  // Re-measure after every click and every resize: screens, tasks and piles
  // only become visible then, before that the elements have no dimensions
  function schedule() { requestAnimationFrame(function () { requestAnimationFrame(TM.scale.visible); }); }
  document.addEventListener('click', schedule);
  document.addEventListener('change', schedule);
  window.addEventListener('resize', schedule);
  TM.on('screen', schedule);
  window.addEventListener('load', schedule);
})(window.TM);
