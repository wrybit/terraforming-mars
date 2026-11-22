import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ServerSettingGrid from '@/client/components/admin/ServerSettingGrid.vue';
import {SERVER_SETTINGS} from '@/common/admin/serverSettings';

const STRENGTH = SERVER_SETTINGS.filter((setting) => setting.group === 'AI strength');

describe('ServerSettingGrid', () => {
  it('shows a line per value with a field for easy, normal and hard, defaults as placeholder', () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {AI_HARD_ROLLOUTS: '96'}}});
    expect(wrapper.findAll('.server-settings-grid-column').map((column) => column.text())).deep.eq(['Easy', 'Normal', 'Hard']);
    const rows = wrapper.findAll('.server-settings-row:not(.server-settings-grid-head)');
    expect(rows).has.length(6);
    expect(rows[0].find('code').text()).eq('AI_*_ROLLOUTS');
    const inputs = rows[0].findAll('input');
    expect(inputs.map((input) => input.attributes('placeholder'))).deep.eq(['4', '16', '64']);
    expect((inputs[2].element as HTMLInputElement).value).eq('96');
  });

  it('reports a changed field with its key', async () => {
    const wrapper = mount(ServerSettingGrid, {...globalConfig, props: {settings: STRENGTH, values: {}}});
    const randomnessEasy = wrapper.findAll('input').find((input) => input.attributes('aria-label')?.includes('Randomness'));
    await randomnessEasy!.setValue('25');
    expect(wrapper.emitted('update')?.[0]).deep.eq(['AI_EASY_RANDOMNESS', '25']);
  });
});
