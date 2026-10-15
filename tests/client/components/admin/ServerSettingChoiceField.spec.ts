import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ServerSettingChoiceField from '@/client/components/admin/ServerSettingChoiceField.vue';
import {serverSettingDefinition} from '@/common/admin/serverSettings';

describe('ServerSettingChoiceField', () => {
  const color = serverSettingDefinition('FAVICON_COLOR')!;
  const props = {
    inputId: 'favicon-color',
    value: 'blue',
    choices: color.choices!,
    image: (value: string) => color.choiceImage!(value, {FAVICON_ICON: 'city'}),
  };

  it('shows the chosen value with its picture, the list only when opened', async () => {
    const wrapper = mount(ServerSettingChoiceField, {...globalConfig, props, attachTo: document.body});
    expect(wrapper.find('.server-setting-choice-button').text()).eq('Blue');
    expect(wrapper.find('.server-setting-choice-button img').attributes('src')).eq('assets/favicon/city-blue.png');
    expect(wrapper.find('.server-setting-choice-list').exists()).is.false;
    await wrapper.find('.server-setting-choice-button').trigger('click');
    expect(wrapper.findAll('.server-setting-choice-option')).has.length(10);
    expect(wrapper.find('.server-setting-choice-option--selected').text()).eq('Blue');
  });

  it('reports the chosen value and closes; the default is the empty value', async () => {
    const wrapper = mount(ServerSettingChoiceField, {...globalConfig, props, attachTo: document.body});
    await wrapper.find('.server-setting-choice-button').trigger('click');
    await wrapper.findAll('.server-setting-choice-option')[0].trigger('click');
    expect(wrapper.emitted('update')).deep.eq([['']]);
    expect(wrapper.find('.server-setting-choice-list').exists()).is.false;
  });

  it('closes on Escape without a change', async () => {
    const wrapper = mount(ServerSettingChoiceField, {...globalConfig, props, attachTo: document.body});
    await wrapper.find('.server-setting-choice-button').trigger('click');
    await wrapper.find('.server-setting-choice-list').trigger('keydown', {key: 'Escape'});
    expect(wrapper.emitted('update')).is.undefined;
    expect(wrapper.find('.server-setting-choice-list').exists()).is.false;
  });
});
