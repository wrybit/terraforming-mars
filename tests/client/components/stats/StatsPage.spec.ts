import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {sampleGames} from './statsFixtures';
import StatsPage from '@/client/components/stats/StatsPage.vue';

describe('StatsPage', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({ok: true, json: () => Promise.resolve(sampleGames())} as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.history.replaceState({}, '', '/');
  });

  it('loads the games and switches views without reloading', async () => {
    const wrapper = mount(StatsPage, {...globalConfig, global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, LanguageIcon: true, PreferencesIcon: true}}});
    await flushPromises();
    expect(wrapper.find('.stats-kpis').exists()).is.true;

    await wrapper.find('a[href="stats?tab=corporation"]').trigger('click');
    expect(window.location.search).eq('?tab=corporation');
    expect(wrapper.text()).to.include('Ecoline');
  });

  it('filtering by lineup narrows the games', async () => {
    const wrapper = mount(StatsPage, {...globalConfig, global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, LanguageIcon: true, PreferencesIcon: true}}});
    await flushPromises();
    const chip = wrapper.findAll('.card-list-chip').find((candidate) => candidate.text().startsWith('Daniel vs Jens') && !candidate.text().includes('Martin'))!;
    await chip.trigger('click');
    expect(wrapper.find('.card-list-summary-total strong').text()).eq('1');
  });
});
