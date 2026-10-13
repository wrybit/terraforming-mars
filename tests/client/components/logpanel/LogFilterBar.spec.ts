import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {fakeViewModel} from '../testHelpers';
import LogFilterBar from '@/client/components/logpanel/LogFilterBar.vue';
import {LogFilter} from '@/client/components/logpanel/logFilter';

describe('LogFilterBar', () => {
  const players = fakeViewModel().players;

  it('shows active filters as chips and removes them with ×', async () => {
    const modelValue: LogFilter = {options: [{group: 'me', value: 'me'}, {group: 'icon', value: 'plant'}], text: ''};
    const wrapper = mount(LogFilterBar, {...globalConfig, props: {modelValue, players, me: players[0].color}});
    expect(wrapper.findAll('.log-filter-chip')).has.length(2);
    await wrapper.findAll('.log-filter-chip-remove')[0].trigger('click');
    const emitted = wrapper.emitted('update:modelValue') as Array<[LogFilter]>;
    expect(emitted[0][0].options).deep.eq([{group: 'icon', value: 'plant'}]);
  });

  it('folds out the options and adds a chip on click', async () => {
    const wrapper = mount(LogFilterBar, {...globalConfig, props: {modelValue: {options: [], text: ''}, players, me: players[0].color}});
    expect(wrapper.find('.log-filter-panel').exists()).to.be.false;
    await wrapper.find('.log-filter-toggle').trigger('click');
    expect(wrapper.findAll('.log-filter-group')).has.length(4);
    await wrapper.find('.log-filter-card--event').element.closest('button')!.click();
    const emitted = wrapper.emitted('update:modelValue') as Array<[LogFilter]>;
    expect(emitted[0][0].options).deep.eq([{group: 'type', value: 'event'}]);
  });

  it('keeps typed text in lower case', async () => {
    const wrapper = mount(LogFilterBar, {...globalConfig, props: {modelValue: {options: [], text: ''}, players}});
    await wrapper.find('input').setValue('Asteroid');
    const emitted = wrapper.emitted('update:modelValue') as Array<[LogFilter]>;
    expect(emitted[emitted.length - 1][0].text).eq('asteroid');
  });
});
