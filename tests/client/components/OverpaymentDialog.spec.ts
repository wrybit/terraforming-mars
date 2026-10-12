import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import OverpaymentDialog from '@/client/components/OverpaymentDialog.vue';
import {newDefaultLedger} from '@/client/components/PaymentLedger';
import {Payment} from '@/common/inputs/Payment';
import {SpendableResource} from '@/common/inputs/Spendable';

function mountDialog(itemName?: string) {
  const ledger = {...newDefaultLedger(), titanium: {available: 5, rate: 3}};
  const payment = {...Payment.EMPTY, titanium: 5};
  const descriptions = Object.fromEntries(Object.keys(ledger).map((unit) => [unit, unit === 'titanium' ? 'Titanium' : unit])) as Record<SpendableResource, string>;
  return mount(OverpaymentDialog, {
    ...globalConfig,
    props: {cost: 13, payment, order: ['megacredits', 'titanium'], ledger, descriptions, itemName},
  });
}

describe('OverpaymentDialog', () => {
  it('shows the excess, the used currency and the reason', () => {
    const wrapper = mountDialog('Asteroid');
    expect(wrapper.find('[data-test=excess]').text()).to.eq('+2');
    expect(wrapper.find('[data-test=accept-excess]').text()).to.eq('+2');
    expect(wrapper.find('[data-test=item]').text()).to.eq('Asteroid');
    expect(wrapper.find('[data-test=segment-titanium]').exists()).is.true;
    expect(wrapper.find('[data-test=segment-megacredits]').exists()).is.false;
    expect(wrapper.find('[data-test=reason]').text()).to.contain('Titanium');
  });

  it('centres the segment icon in the paid part, not across the excess', () => {
    // 5 titanium = 15 M€, cost 13: paid part 0..13, centre 6.5 of 15
    const icon = mountDialog().find('[data-test=segment-titanium] .resource_icon');
    expect(icon.attributes('style')).to.contain('left: 43.33');
  });

  it('omits the item without a name', () => {
    expect(mountDialog().find('[data-test=item]').exists()).is.false;
  });

  it('emits accept and dismiss', async () => {
    const wrapper = mountDialog();
    await wrapper.find('[data-test=accept]').trigger('click');
    await wrapper.find('[data-test=dismiss]').trigger('click');
    expect(wrapper.emitted('accept')).to.have.length(1);
    expect(wrapper.emitted('dismiss')).to.have.length(1);
  });
});
