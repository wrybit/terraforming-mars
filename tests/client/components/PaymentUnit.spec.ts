import {shallowMount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import PaymentUnit from '@/client/components/PaymentUnit.vue';

describe('PaymentUnit', () => {
  it('renders modelValue in the input', () => {
    const wrapper = shallowMount(PaymentUnit, {
      ...globalConfig,
      props: {
        modelValue: 5,
        unit: 'megacredits',
        description: 'MegaCredits',
      },
    });
    const input = wrapper.find('input');
    expect(input.element.value).to.eq('5');
  });

  it('emits update:modelValue on input change', async () => {
    const wrapper = shallowMount(PaymentUnit, {
      ...globalConfig,
      props: {
        modelValue: 0,
        unit: 'megacredits',
        description: 'MegaCredits',
      },
    });
    const input = wrapper.find('input');
    await input.setValue('3');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).to.not.be.undefined;
    expect(emitted!.length).to.be.greaterThanOrEqual(1);
    expect(emitted![0][0]).to.eq('3');
  });

  it('plus and minus buttons emit correct events', async () => {
    const wrapper = shallowMount(PaymentUnit, {
      ...globalConfig,
      props: {
        modelValue: 5,
        unit: 'megacredits',
        description: 'MegaCredits',
        showMax: true,
        target: 8,
      },
    });
    const buttons = wrapper.findAllComponents({name: 'AppButton'});
    // AppButtons are: minus, plus; the target button is a plain button that shows its value
    const minusBtn = buttons.find((b) => b.props('type') === 'minus');
    const plusBtn = buttons.find((b) => b.props('type') === 'plus');
    const targetBtn = wrapper.find('[data-test=target]');

    expect(minusBtn).to.not.be.undefined;
    expect(plusBtn).to.not.be.undefined;
    expect(targetBtn.text()).to.eq('8');

    await minusBtn!.vm.$emit('click');
    expect(wrapper.emitted('minus')).to.not.be.undefined;

    await plusBtn!.vm.$emit('click');
    expect(wrapper.emitted('plus')).to.not.be.undefined;

    await targetBtn.trigger('click');
    expect(wrapper.emitted('max')).to.not.be.undefined;
  });

  it('disables the target button once its value is set', () => {
    const wrapper = shallowMount(PaymentUnit, {
      ...globalConfig,
      props: {
        modelValue: 8,
        unit: 'megacredits',
        description: 'MegaCredits',
        target: 8,
        targetReached: true,
      },
    });
    expect(wrapper.find('[data-test=target]').attributes('disabled')).to.not.be.undefined;
  });
});
