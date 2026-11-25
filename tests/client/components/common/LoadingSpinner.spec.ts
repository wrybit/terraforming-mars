import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LoadingSpinner from '@/client/components/common/LoadingSpinner.vue';

describe('LoadingSpinner', () => {
  it('shows a ring and the loading text, page-wide only on request', () => {
    const card = mount(LoadingSpinner, {...globalConfig});
    expect(card.find('.loading-spinner-ring').exists()).is.true;
    expect(card.text()).eq('Loading…');
    expect(card.find('.loading-spinner').classes()).not.contains('loading-spinner--page');
    const page = mount(LoadingSpinner, {...globalConfig, props: {page: true}});
    expect(page.find('.loading-spinner').classes()).contains('loading-spinner--page');
  });
});
