import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AiSettingIcon from '@/client/components/create/AiSettingIcon.vue';

describe('AiSettingIcon', () => {
  it('shows the picture, the icon or a switch', () => {
    const icon = mount(AiSettingIcon, {...globalConfig, props: {chip: {key: 'a', label: 'Venus Next', iconClass: 'expansion-icon-venus'}}});
    expect(icon.find('.expansion-icon-venus').exists()).is.true;
    const picture = mount(AiSettingIcon, {...globalConfig, props: {chip: {key: 'b', label: 'Spice', picture: 'spice.png'}}});
    expect(picture.find('img').attributes('src')).eq('spice.png');
    const toggle = mount(AiSettingIcon, {...globalConfig, props: {chip: {key: 'c', label: 'Draft variant'}}});
    expect(toggle.find('.create-game-summary-toggle').exists()).is.true;
  });
});
