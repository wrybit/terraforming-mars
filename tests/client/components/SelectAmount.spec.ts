import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectAmount from '@/client/components/SelectAmount.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';

describe('SelectAmount', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectAmount, {
      ...globalConfig,
      props: {
        playerView: {} as PlayerViewModel,
        playerinput: {
          title: 'Select amount',
          buttonLabel: 'Save',
          type: 'amount',
          min: 0,
          max: 5,
          maxByDefault: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows source and target of a known conversion and saves the chosen amount', async () => {
    let saved: unknown;
    const thisPlayer = {heat: 0, heatProduction: 5, megacredits: 20, megacreditProduction: 3, tableau: []};
    const wrapper = shallowMount(SelectAmount, {
      ...globalConfig,
      props: {
        playerView: {thisPlayer} as unknown as PlayerViewModel,
        playerinput: {
          title: 'Select amount of heat production to decrease',
          buttonLabel: 'Decrease',
          type: 'amount',
          min: 1,
          max: 5,
          maxByDefault: false,
          sourceCard: 'Insulation',
        } as any,
        onsave: (out: unknown) => {
          saved = out;
        },
        showsave: true,
        showtitle: false,
      },
    });
    expect(wrapper.findComponent({name: 'AmountConverter'}).exists()).is.true;
    // Conversions start at the maximum
    (wrapper.vm as any).saveData();
    expect(saved).deep.eq({type: 'amount', amount: 5});
  });
});
