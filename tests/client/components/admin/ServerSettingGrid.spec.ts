import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ServerSettingGrid from '@/client/components/admin/ServerSettingGrid.vue';
import {SERVER_SETTINGS} from '@/common/admin/serverSettings';

const STRENGTH = SERVER_SETTINGS.filter((setting) => setting.side === true);

describe('ServerSettingGrid', () => {
  it('shows a line per value with a field for easy, normal and hard, defaults as placeholder', () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {AI_HARD_ROLLOUTS: '96'}}});
    expect(wrapper.findAll('.server-settings-grid-head').map((column) => column.text())).deep.eq(['Easy[AI-]', 'Normal[AI]', 'Hard[AI+]']);
    // One outlined band per strength, from the head to the last field
    expect(wrapper.findAll('.server-settings-grid-band')).has.length(3);
    const rows = wrapper.findAll('.server-settings-grid-row');
    expect(rows).has.length(6);
    expect(rows[0].find('code').text()).eq('AI_*_THINKING_MS');
    const rollouts = rows.find((row) => row.find('code').text() === 'AI_*_ROLLOUTS')!;
    const inputs = rollouts.findAll('input');
    expect(inputs.map((input) => input.attributes('placeholder'))).deep.eq(['4', '16', '64']);
    expect((inputs[2].element as HTMLInputElement).value).eq('96');
  });

  it('reports a changed field with its key', async () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {}}});
    const randomnessEasy = wrapper.findAll('input').find((input) => input.attributes('aria-label')?.includes('Randomness'));
    await randomnessEasy!.setValue('25');
    expect(wrapper.emitted('update')?.[0]).deep.eq(['AI_EASY_RANDOMNESS', '25']);
  });

  it('limits the threads to the cores of the server and marks a value above it', () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {AI_HARD_THREADS: '8'},
      rowLimits: {threads: {maximum: 1, note: 'This server has 1 cores'}}}});
    const threads = wrapper.findAll('.server-settings-grid-row').find((row) => row.find('code').text() === 'AI_*_THREADS')!;
    expect(threads.find('.server-settings-grid-limit').text()).eq('This server has 1 cores');
    const inputs = threads.findAll('input');
    expect(inputs.map((input) => input.attributes('max'))).deep.eq(['1', '1', '1']);
    expect(inputs.map((input) => input.attributes('placeholder'))).deep.eq(['1', '1', '1']);
    expect(inputs[2].classes()).contains('server-settings-grid-input--invalid');
  });
});

