import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {afterEach, vi} from 'vitest';
import {globalConfig} from '@tests/client/components/getLocalVue';
import StatsEntityAsset from '@/client/components/stats/StatsEntityAsset.vue';
import {applyTheme} from '@/client/theme/applyTheme';

describe('StatsEntityAsset', () => {
  afterEach(async () => {
    await applyTheme('mars');
    vi.unstubAllGlobals();
  });

  it('shows a milestone as the Mars board tile', () => {
    const wrapper = mount(StatsEntityAsset, {...globalConfig, props: {kind: 'milestone', name: 'Terraformer'}});
    expect(wrapper.find('.milestones').exists()).is.true;
    expect(wrapper.find('.dune-goal-card').exists()).is.false;
  });

  it('shows milestones and awards as Dune goal cards in the Dune theme', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({json: async () => ({})})));
    await applyTheme('dune');
    const milestone = mount(StatsEntityAsset, {...globalConfig, props: {kind: 'milestone', name: 'Terraformer'}});
    expect(milestone.find('.dune-goal-card--milestones').exists()).is.true;
    const award = mount(StatsEntityAsset, {...globalConfig, props: {kind: 'award', name: 'Thermalist'}});
    expect(award.find('.dune-goal-card--awards').exists()).is.true;
  });
});
