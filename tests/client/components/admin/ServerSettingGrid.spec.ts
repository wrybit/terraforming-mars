import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ServerSettingGrid from '@/client/components/admin/ServerSettingGrid.vue';
import {SERVER_SETTINGS} from '@/common/admin/serverSettings';

const STRENGTH = SERVER_SETTINGS.filter((setting) => setting.side === true);

describe('ServerSettingGrid', () => {
  it('shows a line per value with a field for easy, normal and hard, each with the value that applies', () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {AI_HARD_ROLLOUTS: '96'}}});
    expect(wrapper.findAll('.server-settings-grid-head').map((column) => column.text())).deep.eq(['Easy[AI-]', 'Normal[AI]', 'Hard[AI+]']);
    // One outlined band per strength, from the head to the last field
    expect(wrapper.findAll('.server-settings-grid-band')).has.length(3);
    const rows = wrapper.findAll('.server-settings-grid-row');
    expect(rows).has.length(6);
    expect(rows[0].find('code').text()).eq('AI_*_THINKING_MS');
    const rollouts = rows.find((row) => row.find('code').text() === 'AI_*_ROLLOUTS')!;
    const inputs = rollouts.findAll('input.server-settings-grid-input');
    expect(inputs.map((input) => (input.element as HTMLInputElement).value)).deep.eq(['4', '16', '96']);
    // A slider per field over the same value
    const sliders = rollouts.findAll('input.server-settings-grid-slider');
    expect(sliders.map((slider) => (slider.element as HTMLInputElement).value)).deep.eq(['4', '16', '96']);
  });

  it('reports a changed field with its key', async () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {}}});
    const randomnessEasy = wrapper.findAll('input.server-settings-grid-input').find((input) => input.attributes('aria-label')?.includes('Randomness'));
    await randomnessEasy!.setValue('25');
    expect(wrapper.emitted('update')?.[0]).deep.eq(['AI_EASY_RANDOMNESS', '25']);
  });

  it('moves the value with the slider and stores the default as no line', async () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {}}});
    const thinking = wrapper.findAll('.server-settings-grid-row').find((row) => row.find('code').text() === 'AI_*_THINKING_MS')!;
    const slider = thinking.findAll('input.server-settings-grid-slider')[0];
    expect([slider.attributes('min'), slider.attributes('max'), slider.attributes('step')]).deep.eq(['50', '5000', '50']);
    await slider.setValue('1200');
    expect(wrapper.emitted('update')?.[0]).deep.eq(['AI_EASY_THINKING_MS', '1200']);
    const easyDefault = thinking.findAll('input.server-settings-grid-input')[0].element as HTMLInputElement;
    await slider.setValue(easyDefault.value);
    expect(wrapper.emitted('update')?.[1]).deep.eq(['AI_EASY_THINKING_MS', '']);
  });

  it('limits the threads to the cores of the server and marks a value above it', () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {AI_HARD_THREADS: '8'},
      rowLimits: {threads: {maximum: 1, note: 'This server has 1 cores'}}}});
    const threads = wrapper.findAll('.server-settings-grid-row').find((row) => row.find('code').text() === 'AI_*_THREADS')!;
    expect(threads.find('.server-settings-grid-limit').text()).eq('This server has 1 cores');
    const inputs = threads.findAll('input.server-settings-grid-input');
    expect(inputs.map((input) => input.attributes('max'))).deep.eq(['1', '1', '1']);
    expect(inputs.map((input) => (input.element as HTMLInputElement).value)).deep.eq(['1', '1', '8']);
    expect(threads.findAll('input.server-settings-grid-slider').map((slider) => slider.attributes('max'))).deep.eq(['1', '1', '1']);
    expect(inputs[2].classes()).contains('server-settings-grid-input--invalid');
  });
});

