import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import RawDataCard from '@/client/components/admin/RawDataCard.vue';

describe('RawDataCard', () => {
  it('only links a download instead of loading it', () => {
    const originalFetch = global.fetch;
    let fetched = false;
    global.fetch = () => {
      fetched = true;
      return Promise.reject(new Error('no fetch expected'));
    };
    try {
      const wrapper = mount(RawDataCard, {...globalConfig, props: {label: 'Memory snapshot (large download)', path: 'api/heapsnapshot', kind: 'download'}});
      expect(fetched).is.false;
      expect(wrapper.find('a').attributes('href')).eq('api/heapsnapshot');
      expect(wrapper.find('.raw-data-content').exists()).is.false;
    } finally {
      global.fetch = originalFetch;
    }
  });
});
