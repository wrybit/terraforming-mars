import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ServerSettingQuotaField from '@/client/components/admin/ServerSettingQuotaField.vue';

function field(value: string) {
  return mount(ServerSettingQuotaField, {...globalConfig, props: {inputId: 'quota', value}});
}

function lastUpdate(wrapper: ReturnType<typeof field>): string {
  const updates = wrapper.emitted('update') as Array<[string]>;
  return updates[updates.length - 1][0];
}

describe('ServerSettingQuotaField', () => {
  it('shows each limit as a row, no JSON', () => {
    const wrapper = field('[{"limit":5,"per":"10m"},{"limit":30,"per":"1d"}]');
    const rows = wrapper.findAll('.server-setting-quota-row');
    expect(rows).has.length(2);
    expect((rows[1].findAll('input')[0].element as HTMLInputElement).value).eq('30');
    expect((rows[1].find('select').element as HTMLSelectElement).value).eq('d');
    expect(wrapper.text()).not.to.include('{');
  });

  it('says unlimited without a limit and adds one', async () => {
    const wrapper = field('');
    expect(wrapper.find('.server-setting-quota-empty').exists()).is.true;
    await wrapper.find('.server-setting-quota-add').trigger('click');
    expect(lastUpdate(wrapper)).eq('[{"limit":5,"per":"1h"}]');
  });

  it('changes and removes limits', async () => {
    const wrapper = field('[{"limit":5,"per":"10m"},{"limit":30,"per":"1d"}]');
    await wrapper.findAll('.server-setting-quota-row')[0].findAll('input')[0].setValue('3');
    expect(lastUpdate(wrapper)).eq('[{"limit":3,"per":"10m"},{"limit":30,"per":"1d"}]');
    await wrapper.findAll('.server-setting-quota-row')[0].find('select').setValue('h');
    expect(lastUpdate(wrapper)).eq('[{"limit":3,"per":"10h"},{"limit":30,"per":"1d"}]');
    await wrapper.findAll('.server-setting-quota-remove')[1].trigger('click');
    expect(lastUpdate(wrapper)).eq('[{"limit":3,"per":"10h"}]');
  });

  it('reports a value it cannot read', () => {
    const wrapper = field('{"limit":3');
    expect(wrapper.find('.server-setting-quota-note').exists()).is.true;
  });
});
