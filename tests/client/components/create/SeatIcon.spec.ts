import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';

describe('SeatIcon', () => {
  it('draws a different shape for human, AI and none', () => {
    const paths = (['human', 'ai', 'none'] as const).map((kind) =>
      mount(SeatIcon, {...globalConfig, props: {kind}}).find('path').attributes('d'));
    expect(new Set(paths).size).eq(3);
  });

  it('uses the given size', () => {
    const wrapper = mount(SeatIcon, {...globalConfig, props: {kind: 'ai', size: 24}});
    expect(wrapper.attributes('width')).eq('24');
  });
});
