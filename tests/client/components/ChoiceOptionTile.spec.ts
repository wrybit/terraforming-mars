import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import ChoiceOptionTile from '@/client/components/ChoiceOptionTile.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

describe('ChoiceOptionTile', () => {
  const player = {name: 'alpha', color: 'blue', steel: 2, steelProduction: 1} as PublicPlayerModel;

  it('shows the resource and the own production before and after', () => {
    const wrapper = mount(ChoiceOptionTile, {
      ...globalConfig,
      props: {title: 'Increase steel production 1 step', player, selected: false, groupName: 'g'},
    });
    expect(wrapper.find('.resource_icon--steel').exists()).is.true;
    expect(wrapper.find('.choice-option-after--gain').text()).eq('→+2');
  });

  it('stays plain text without a resource', () => {
    const wrapper = mount(ChoiceOptionTile, {
      ...globalConfig,
      props: {title: 'Do not remove resource', player, selected: false, groupName: 'g'},
    });
    expect(wrapper.find('.resource_icon').exists()).is.false;
  });

  it('emits select', async () => {
    const wrapper = mount(ChoiceOptionTile, {...globalConfig, props: {title: 'x', selected: false, groupName: 'g'}});
    await wrapper.find('input').trigger('change');
    expect(wrapper.emitted('select')).has.length(1);
  });
});
