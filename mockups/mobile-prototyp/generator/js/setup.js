// Start selection in three steps: corporation, preludes, buy cards. The balance sits in the footer.
(function (TM) {
  'use strict';

  var STEPS = ['corporation', 'prelude', 'projects'];
  var LIMITS = {corporation: 1, prelude: 2};
  var CARD_PRICE = 3;
  var NEXT_LABELS = {corporation: 'Next: preludes', prelude: 'Next: buy cards'};
  var values = window.TM_DATA.setup;
  var setup;
  var step = 'corporation';

  function column(name) { return TM.$('.setup-column--' + name, setup); }
  function chosen(name) { return TM.$all('input:checked', column(name)).map(function (input) { return TM.slugOf(input.closest('label').querySelector('.card-container')); }); }
  function number(text) { return parseInt(String(text).replace('−', '-').replace('±', ''), 10) || 0; }
  function signed(value) { return value > 0 ? '+' + value : value < 0 ? '−' + Math.abs(value) : '±0'; }

  function summaryValue(label, text, className) {
    var item = TM.$all('.setup-summary-item', setup.ownerDocument).filter(function (entry) { return entry.querySelector('dt').textContent.indexOf(label) === 0; })[0];
    if (!item) return;
    var value = item.querySelector('dd');
    value.textContent = text;
    if (className !== undefined) value.className = className;
    return item;
  }

  function evaluate() {
    var corporation = chosen('corporation');
    var preludes = chosen('prelude');
    var projects = chosen('projects');
    var start = corporation.length ? number(values.corps[corporation[0]]) : null;
    var preludeDelta = preludes.reduce(function (sum, slug) { return sum + number(values.preludes[slug]); }, 0);
    var purchase = projects.length * CARD_PRICE;
    var remaining = start === null ? null : start + preludeDelta - purchase;

    summaryValue('Start', start === null ? '–' : String(start));
    summaryValue('Prelude', signed(preludeDelta));
    var purchaseItem = summaryValue('Purchase', signed(-purchase));
    if (purchaseItem) purchaseItem.querySelector('dt').textContent = 'Purchase (' + projects.length + ' × ' + CARD_PRICE + ')';
    summaryValue('Remaining', remaining === null ? '–' : String(remaining), remaining !== null && remaining < 0 ? 'mb-negative' : 'mb-remaining');

    var status = !corporation.length ? 'Select a corporation'
      : preludes.length < LIMITS.prelude ? 'Select ' + (LIMITS.prelude - preludes.length) + ' more prelude' + (LIMITS.prelude - preludes.length > 1 ? 's' : '')
      : remaining < 0 ? 'Not enough M€ – buy fewer cards'
      : 'Ready';
    summaryValue('Status', status, status === 'Ready' ? 'setup-summary-status--ready' : 'setup-summary-status--open');

    TM.$('[data-step-count="corporation"]').textContent = corporation.length + '/1';
    TM.$('[data-step-count="prelude"]').textContent = preludes.length + '/2';
    TM.$('[data-step-count="projects"]').textContent = String(projects.length);
    var ready = status === 'Ready';
    var next = document.getElementById('setupNext');
    var stepDone = step === 'corporation' ? corporation.length === 1 : step === 'prelude' ? preludes.length === 2 : ready;
    next.textContent = NEXT_LABELS[step] || 'Start';
    next.disabled = !stepDone;
    next.classList.toggle('is-final', step === 'projects');
  }

  function goToStep(name) {
    step = name;
    setup.dataset.step = name;
    TM.$all('.mb-step').forEach(function (button) { button.classList.toggle('is-active', button.dataset.step === name); });
    TM.$('.mb-screen[data-screen="setup"]').scrollTop = 0;
    evaluate();
  }

  // Limits as in the original, but phone-friendly: for the corporation the new choice replaces the old one
  function enforceLimit(input) {
    var name = STEPS.filter(function (candidate) { return column(candidate).contains(input); })[0];
    if (!input.checked || !LIMITS[name]) return;
    var checked = TM.$all('input:checked', column(name));
    if (checked.length <= LIMITS[name]) return;
    if (name === 'corporation') {
      checked.forEach(function (other) { if (other !== input) other.checked = false; });
    } else {
      input.checked = false;
      TM.toast('You can pick exactly ' + LIMITS[name] + ' preludes');
    }
  }

  TM.setup = {
    start: function () {
      setup = document.getElementById('setupRoot');
      document.getElementById('app').classList.add('is-setup');
      // The real balance bar moves into the footer
      document.getElementById('setupSummary').appendChild(TM.$('.setup-summary-values', setup));
      TM.$all('.setup-summary', setup).forEach(function (summary) { summary.hidden = true; });
      TM.nav.go('setup');
      goToStep('corporation');
    },
  };

  document.addEventListener('change', function (event) {
    if (!setup || !setup.contains(event.target)) return;
    enforceLimit(event.target);
    TM.cards.syncSelection(setup);
    evaluate();
  });
  TM.onClick('[data-step]', function (button) { if (button.classList.contains('mb-step')) goToStep(button.dataset.step); else return false; });
  TM.onClick('#setupNext', function (button) {
    if (button.disabled) return;
    var index = STEPS.indexOf(step);
    if (index < STEPS.length - 1) { goToStep(STEPS[index + 1]); return; }
    TM.toast('Game starts – the prototype jumps to generation 6');
    TM.wait(1400).then(function () { location.hash = 'game'; location.reload(); });
  });
})(window.TM);
