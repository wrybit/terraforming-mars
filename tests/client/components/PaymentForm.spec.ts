import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PaymentForm from '@/client/components/PaymentForm.vue';
import {Payment} from '@/common/inputs/Payment';
import {Ledger, newDefaultLedger} from '@/client/components/PaymentLedger';
import {SpendableResource} from '@/common/inputs/Spendable';

function mountPaymentForm(overrides: {
  cost: number,
  order?: ReadonlyArray<SpendableResource>,
  ledger?: Partial<Ledger>,
  showsave?: boolean,
}) {
  const order = overrides.order ?? ['megacredits'];
  const ledger = overrides.ledger ?? {};
  const props = {
    cost: overrides.cost,
    order,
    ledger: {...newDefaultLedger(), ...ledger},
    showsave: overrides.showsave ?? true,
    buttonLabel: 'Save',
  };

  return mount(PaymentForm, {
    ...globalConfig,
    props,
  });
}

describe('PaymentForm', () => {
  it('shows only the price when a single currency is available', async () => {
    const wrapper = mountPaymentForm({
      cost: 7,
      order: ['megacredits', 'heat'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
      },
    });

    expect(wrapper.find('.payments_single').text()).contains('7');
    expect(wrapper.find('[data-test=megacredits] input').exists()).is.false;
    expect(wrapper.find('.payments_divider--total').exists()).is.false;
    expect(wrapper.find('[data-test=rest-megacredits]').text()).contains('3');
  });

  it('renders only resources in spendableResources', async () => {
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['heat', 'megacredits'],
      ledger: {
        'heat': {available: 1, rate: 1},
        'megacredits': {available: 1, rate: 1},
      },
    });

    expect(wrapper.find('[data-test=heat] input').exists()).is.true;
    expect(wrapper.find('[data-test=megacredits] input').exists()).is.true;
    expect(wrapper.find('[data-test=steel] input').exists()).is.false;
  });

  it('renders no components when spendableResources is empty', async () => {
    const wrapper = mountPaymentForm({cost: 0, order: []});

    expect(wrapper.find('[data-test=heat] input').exists()).is.false;
    expect(wrapper.find('[data-test=megacredits] input').exists()).is.false;
  });

  it('shows reserve warning', async () => {
    const wrapper = mountPaymentForm({
      cost: 1,
      order: ['heat', 'steel', 'megacredits'],
      ledger: {
        'heat': {available: 1, rate: 1, reserved: true},
        'steel': {available: 1, rate: 2, reserved: false},
        'megacredits': {available: 1, rate: 1},
      },
    });

    expect(wrapper.findAll('.card-warning')).has.length(1);
  });

  it('shows save button when showsave is true', async () => {
    const wrapper = mountPaymentForm({cost: 1, showsave: true});

    expect(wrapper.find('[data-test=save]').exists()).is.true;
  });

  it('hides save button when showsave is false', async () => {
    const wrapper = mountPaymentForm({cost: 1, showsave: false});

    expect(wrapper.find('[data-test=save]').exists()).is.false;
  });

  it('emits save when save button clicked and payment is valid', async () => {
    const wrapper = mountPaymentForm({
      cost: 0,
    });

    await wrapper.find('[data-test=save]').trigger('click');
    expect(wrapper.emitted('save')).to.exist;
  });

  it('plus increases the clicked resource and decreases megacredits', async () => {
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['heat', 'megacredits'],
      ledger: {
        'heat': {available: 5, rate: 1},
        'megacredits': {available: 10, rate: 1},
      },
    });

    await wrapper.find('[data-test=megacredits] input').setValue(8);
    await wrapper.find('[data-test=heat] input').setValue(2);
    await wrapper.find('[data-test=heat] .btn-plus').trigger('click');
    await wrapper.vm.$nextTick();

    const lp = wrapper.vm.payment;
    expect(lp.heat).eq(3);
    expect(lp.megacredits).eq(7);
  });

  it('minus decreases the clicked resource and increases megacredits', async () => {
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['heat', 'megacredits'],
      ledger: {
        'heat': {available: 5, rate: 1},
        'megacredits': {available: 10, rate: 1},
      },
    });

    await wrapper.find('[data-test=megacredits] input').setValue(8);
    await wrapper.find('[data-test=heat] input').setValue(2);
    await wrapper.find('[data-test=heat] .btn-minus').trigger('click');
    await wrapper.vm.$nextTick();

    const lp = wrapper.vm.payment;
    expect(lp.heat).eq(1);
    expect(lp.megacredits).eq(9);
  });

  it('max caps even if there is an excess of resources', async () => {
    // Steel worth 2 MC each; cost is 10; floor(10/2) = 5 max steel regardless of 20 available
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['steel', 'megacredits'],
      ledger: {
        'steel': {available: 20, rate: 2},
        'megacredits': {available: 10, rate: 1},
      },
    });

    // The defaults already use the target, so start from 0 to make the button clickable
    wrapper.vm.payment.steel = 0;
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-test=steel] [data-test=target]').trigger('click');
    await wrapper.vm.$nextTick();

    const lp = wrapper.vm.payment;
    expect(lp.steel).eq(5);
    expect(lp.megacredits).eq(0);
  });

  it('max respects the resource rate when computing how many resources to use', async () => {
    // Titanium worth 3 MC each; cost is 11; floor(11/3) = 3 titanium, leaving 2 MC
    const wrapper = mountPaymentForm({
      cost: 11,
      order: ['titanium', 'megacredits'],
      ledger: {
        'titanium': {available: 10, rate: 3},
        'megacredits': {available: 10, rate: 1},
      },
    });

    // The defaults already use the target, so start from 0 to make the button clickable
    wrapper.vm.payment.titanium = 0;
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-test=titanium] [data-test=target]').trigger('click');
    await wrapper.vm.$nextTick();

    const lp = wrapper.vm.payment;
    expect(lp.titanium).eq(3);
    expect(lp.megacredits).eq(2);
  });

  it('megacredits never go below zero', async () => {
    // heat fills the entire cost; MC floors at 0
    const wrapper = mountPaymentForm({
      cost: 8,
      order: ['heat', 'megacredits'],
      ledger: {
        'heat': {available: 20, rate: 1},
        'megacredits': {available: 5, rate: 1},
      },
    });

    await wrapper.find('[data-test=heat] [data-test=target]').trigger('click');
    await wrapper.vm.$nextTick();

    const lp = wrapper.vm.payment;
    expect(lp.heat).eq(8);
    expect(lp.megacredits).eq(0);
  });

  it('computes greedy defaults', async () => {
    // cost=10, steel rate=2 available=3, megacredits available=5
    // greedy: ceil(max(10-5,0)/2)=3 steel (6 MC), then MC=min(5,max(10-6,0))=4
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['steel', 'megacredits'],
      ledger: {
        'steel': {available: 3, rate: 2},
        'megacredits': {available: 5, rate: 1},
      },
    });

    const lp = wrapper.vm.payment;
    expect(lp.steel).eq(3);
    expect(lp.megacredits).eq(4);
  });

  it('megacredits target balances what the other resources leave open', async () => {
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['megacredits', 'heat'],
      ledger: {
        'megacredits': {available: 12, rate: 1},
        // Second currency, otherwise the form shows no sliders (only the price)
        'heat': {available: 1, rate: 1},
      },
    });
    wrapper.vm.payment.megacredits = 3;
    await wrapper.vm.$nextTick();

    await wrapper.find('[data-test=megacredits] [data-test=target]').trigger('click');
    await wrapper.vm.$nextTick();

    const payment = wrapper.vm.payment;
    expect(payment.megacredits + payment.heat).eq(10);
  });

  it('megacredits target never overpays', async () => {
    // cost=10, steel=5 at rate 2 covers everything by default; 8 M€ leave 2 to cover with 1 steel
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['steel', 'megacredits'],
      ledger: {
        'steel': {available: 5, rate: 2},
        'megacredits': {available: 8, rate: 1},
      },
    });

    const lp = wrapper.vm.payment;
    expect(lp.steel).eq(5);
    expect(lp.megacredits).eq(0);

    const target = wrapper.find('[data-test=megacredits] [data-test=target]');
    expect(target.text()).eq('8');
    await target.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.payment.steel).eq(1);
    expect(wrapper.vm.payment.megacredits).eq(8);
    expect(wrapper.find('[data-test=megacredits] [data-test=target-reached]').exists()).is.true;
  });

  it('megacredits target pays as much as possible in M€ and frees the other resources', async () => {
    // cost=14, 4 titanium at rate 3 (12) + 2 M€ – 80 M€ left, so the M€ target still offers 14
    const wrapper = mountPaymentForm({
      cost: 14,
      order: ['titanium', 'megacredits'],
      ledger: {
        'titanium': {available: 4, rate: 3},
        'megacredits': {available: 80, rate: 1},
      },
    });
    expect(wrapper.vm.payment.titanium).eq(4);
    expect(wrapper.vm.payment.megacredits).eq(2);
    expect(wrapper.find('[data-test=titanium] [data-test=target-reached]').exists()).is.true;

    const target = wrapper.find('[data-test=megacredits] [data-test=target]');
    expect(target.text()).eq('14');
    await target.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.payment.titanium).eq(0);
    expect(wrapper.vm.payment.megacredits).eq(14);
    expect(wrapper.find('[data-test=titanium] [data-test=target]').text()).eq('4');
  });

  it('titanium target uses as much as fits and M€ cover the rest', async () => {
    // cost=20, 7 titanium at rate 3, only 4 M€
    const wrapper = mountPaymentForm({
      cost: 20,
      order: ['titanium', 'megacredits'],
      ledger: {
        'titanium': {available: 7, rate: 3},
        'megacredits': {available: 4, rate: 1},
      },
    });
    wrapper.vm.payment.titanium = 0;
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-test=titanium] [data-test=target]').trigger('click');
    await wrapper.vm.$nextTick();
    // floor(20/3)=6 titanium (18) + 2 M€ fits exactly
    expect(wrapper.vm.payment.titanium).eq(6);
    expect(wrapper.vm.payment.megacredits).eq(2);
  });

  it('disables + at the limit and − at 0', async () => {
    const wrapper = mountPaymentForm({
      cost: 14,
      order: ['titanium', 'megacredits'],
      ledger: {
        'titanium': {available: 4, rate: 3},
        'megacredits': {available: 80, rate: 1},
      },
    });
    const buttons = (unit: string) => wrapper.findAll(`[data-test=${unit}] .btn`);
    // 4 of 4 titanium: + does nothing any more
    expect(buttons('titanium')[1].attributes('disabled')).to.not.be.undefined;
    expect(buttons('titanium')[0].attributes('disabled')).to.be.undefined;
    wrapper.vm.payment.titanium = 0;
    wrapper.vm.payment.megacredits = 14;
    await wrapper.vm.$nextTick();
    expect(buttons('titanium')[0].attributes('disabled')).to.not.be.undefined;
    // 14 M€ cover the cost: more M€ would change nothing
    expect(buttons('megacredits')[1].attributes('disabled')).to.not.be.undefined;
  });

  it('emits change with initial payment on mount', async () => {
    const wrapper = mountPaymentForm({
      cost: 7,
      order: ['megacredits'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
      },
    });

    const emitted = wrapper.emitted('change') as Payment[][];
    expect(emitted).to.exist;
    expect(emitted[0][0].megacredits).eq(7);
  });

  it('emits change when a resource amount is adjusted', async () => {
    const wrapper = mountPaymentForm({
      cost: 7,
      order: ['megacredits', 'heat'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
        // Second currency, otherwise the form shows no sliders (only the price)
        'heat': {available: 1, rate: 1},
      },
    });

    await wrapper.find('[data-test=megacredits] .btn-minus').trigger('click');
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('change') as Payment[][];
    const last = emitted[emitted.length - 1][0];
    expect(last.megacredits).eq(6);
  });

  it('save emits the payment value', async () => {
    const wrapper = mountPaymentForm({
      cost: 7,
      order: ['megacredits'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
      },
    });

    await wrapper.find('[data-test=save]').trigger('click');
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('save') as Payment[][];
    expect(emitted).to.exist;
    expect(emitted[0][0]).deep.eq(Payment.of({megacredits: 7}));
  });

  it('clicking save emits save immediately when cost is zero', async () => {
    const wrapper = mountPaymentForm({cost: 0});

    await wrapper.find('[data-test=save]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('save')).to.exist;
    expect(wrapper.find('.tm-warning').exists()).is.false;
  });

  it('clicking save shows warning when underpaying', async () => {
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['megacredits', 'heat'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
        // Second currency, otherwise the form shows no sliders (only the price)
        'heat': {available: 1, rate: 1},
      },
    });
    await wrapper.find('[data-test=megacredits] input').setValue(5);
    await wrapper.find('[data-test=save]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('save')).to.not.exist;
    expect(wrapper.find('.tm-warning').exists()).is.true;
  });

  it('clicking save shows warning when spending more than available units', async () => {
    // payment claims 8 heat but only 5 are available
    const wrapper = mountPaymentForm({
      cost: 8,
      order: ['megacredits', 'heat'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
        // Second currency, otherwise the form shows no sliders (only the price)
        'heat': {available: 1, rate: 1},
      },
    });

    await wrapper.find('[data-test=megacredits] input').setValue(9);
    await wrapper.find('[data-test=save]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('save')).to.not.exist;
    expect(wrapper.find('.tm-warning').exists()).is.true;
  });

  it('clicking save emits save and clears warning when payment is valid', async () => {
    const wrapper = mountPaymentForm({
      cost: 10,
      order: ['megacredits'],
      ledger: {
        'megacredits': {available: 10, rate: 1},
      },
    });

    // Trigger a bad save first to set a warning
    wrapper.vm.warning = 'Haven\'t spent enough';
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.tm-warning').exists()).is.true;

    await wrapper.find('[data-test=save]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('save')).to.exist;
    expect(wrapper.find('.tm-warning').exists()).is.false;
  });
});
