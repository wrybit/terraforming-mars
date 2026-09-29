// Karten-Karussell beim Bauen: Punkte zeigen Position und Anzahl, die mittige Karte ist die gewählte.
(function (TM) {
  'use strict';

  var track;
  var dots;
  var settleTimer;

  function cards() { return TM.$all('label.payments_cards', track); }

  // Karte, deren Mitte der Mitte des sichtbaren Bereichs am nächsten liegt
  function centeredIndex() {
    var middle = track.getBoundingClientRect().left + track.clientWidth / 2;
    var best = 0;
    var bestDistance = Infinity;
    cards().forEach(function (card, index) {
      var rect = card.getBoundingClientRect();
      var distance = Math.abs(rect.left + rect.width / 2 - middle);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
    return best;
  }

  function renderDots(active) {
    var list = cards();
    if (dots.children.length !== list.length) {
      dots.innerHTML = list.map(function (card, index) {
        return '<button type="button" class="mb-dot" data-carousel-dot="' + index + '" aria-label="Card ' + (index + 1) + ' of ' + list.length + '"></button>';
      }).join('');
    }
    TM.$all('.mb-dot', dots).forEach(function (dot, index) { dot.classList.toggle('is-active', index === active); });
    dots.dataset.count = (active + 1) + ' / ' + list.length;
  }

  // Wischen wählt die Karte: nach dem Einrasten die mittige Karte ankreuzen, damit Bezahlen mitzieht
  function selectCentered() {
    var index = centeredIndex();
    var input = cards()[index] && cards()[index].querySelector('input');
    renderDots(index);
    if (input && !input.checked) {
      input.checked = true;
      input.dispatchEvent(new Event('change', {bubbles: true}));
    }
  }

  function scrollToIndex(index, smooth) {
    var card = cards()[index];
    if (!card) return;
    var left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({left: left, behavior: smooth ? 'smooth' : 'auto'});
  }

  TM.carousel = {
    init: function () {
      var panel = TM.$('.mb-panel[data-key="build"]');
      track = TM.$('.payments_cont', panel);
      dots = document.createElement('div');
      dots.className = 'mb-dots';
      track.parentNode.insertBefore(dots, track.nextSibling);
      track.addEventListener('scroll', function () {
        renderDots(centeredIndex());
        clearTimeout(settleTimer);
        settleTimer = setTimeout(selectCentered, 140);
      }, {passive: true});
    },

    // Beim Öffnen: auf die gewählte Karte springen und Punkte aufbauen
    show: function () {
      var list = cards();
      var chosen = list.findIndex(function (card) { return card.querySelector('input').checked; });
      requestAnimationFrame(function () {
        scrollToIndex(Math.max(0, chosen), false);
        renderDots(Math.max(0, chosen));
      });
    },
  };

  TM.onClick('[data-carousel-dot]', function (dot) { scrollToIndex(Number(dot.dataset.carouselDot), true); });
  // Antippen einer Seitenkarte holt sie in die Mitte
  TM.onClick('.mb-panel[data-key="build"] label.payments_cards', function (card) {
    scrollToIndex(cards().indexOf(card), true);
    return false;
  });
})(window.TM);
