import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SetupSummary from '@/client/components/SetupSummary.vue';

describe('SetupSummary', () => {
  function values(wrapper: ReturnType<typeof mount>): Array<string> {
    return wrapper.findAll('dd').map((dd) => dd.text());
  }

  it('shows the balance of corporation, preludes and purchase', () => {
    const wrapper = mount(SetupSummary, {
      ...globalConfig,
      props: {startMegacredits: 42, preludeMegacredits: 30, purchasedCount: 2, cardCost: 3, status: 'Ready to start', statusReady: true},
    });
    expect(values(wrapper)).deep.eq(['42', '+30', '−6', '66', 'Ready to start']);
    expect(wrapper.find('.setup-summary-status--ready').exists()).is.true;
  });

  it('shows dashes without corporation and hides preludes without the expansion', () => {
    const wrapper = mount(SetupSummary, {
      ...globalConfig,
      props: {startMegacredits: undefined, preludeMegacredits: undefined, purchasedCount: 0, cardCost: 3, status: 'Select a corporation', statusReady: false},
    });
    expect(values(wrapper)).deep.eq(['–', '±0', '–', 'Select a corporation']);
    expect(wrapper.find('.setup-summary-status--open').exists()).is.true;
  });

  it('marks a negative remainder', () => {
    const wrapper = mount(SetupSummary, {
      ...globalConfig,
      props: {startMegacredits: 20, preludeMegacredits: -18, purchasedCount: 1, cardCost: 3, status: 'Ready to start', statusReady: true},
    });
    expect(wrapper.find('.setup-summary-coin--negative').text()).eq('−1');
  });

  it('marks a purchase above the starting M€ and renders the start button slot', () => {
    const wrapper = mount(SetupSummary, {
      ...globalConfig,
      props: {startMegacredits: 23, preludeMegacredits: 5, purchasedCount: 8, cardCost: 3, status: 'Not enough starting M€ for these cards', statusReady: false},
      slots: {default: '<button class="start">Start</button>'},
    });
    expect(wrapper.find('.setup-summary-value--negative').text()).eq('−24');
    expect(wrapper.find('.setup-summary-actions .start').exists()).is.true;
  });
});
