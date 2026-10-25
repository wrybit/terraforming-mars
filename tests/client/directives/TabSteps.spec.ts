import {expect} from 'chai';
import {stepsNeeded, TAB_STEPS} from '@/client/directives/TabSteps';
import {compactTabLabel, mediumTabLabel} from '@/client/components/orOptionsShortLabels';

// A bar whose content shrinks by 100 px with every step it gets
function bar(width: number, fullContent: number): HTMLElement {
  const element = document.createElement('div');
  const steps = () => TAB_STEPS.filter((attribute) => element.hasAttribute(attribute)).length;
  Object.defineProperty(element, 'clientWidth', {get: () => width});
  Object.defineProperty(element, 'scrollWidth', {get: () => fullContent - 100 * steps()});
  return element;
}

describe('TabSteps', () => {
  it('adds steps in their order only until the tabs fit', () => {
    expect(stepsNeeded(bar(800, 700))).eq(0);
    const narrow = bar(500, 750);
    expect(stepsNeeded(narrow)).eq(3);
    expect(TAB_STEPS.filter((attribute) => narrow.hasAttribute(attribute))).deep.eq(TAB_STEPS.slice(0, 3));
  });

  it('stops after the last step even if the tabs still do not fit', () => {
    expect(stepsNeeded(bar(100, 2000))).eq(TAB_STEPS.length);
  });

  it('knows the shorter forms of the labels', () => {
    expect([mediumTabLabel('Convert 8 heat into temperature'), compactTabLabel('Convert 8 heat into temperature')]).deep.eq(['Temperature', 'Temp.']);
    expect([mediumTabLabel('Sell patents'), compactTabLabel('Sell patents')]).deep.eq([undefined, 'Sale']);
    expect(compactTabLabel('Standard projects')).is.undefined;
  });
});
