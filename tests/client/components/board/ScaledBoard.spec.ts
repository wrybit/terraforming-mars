import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ScaledBoard from '@/client/components/board/ScaledBoard.vue';
import {BoardName} from '@/common/boards/BoardName';

describe('ScaledBoard', () => {
  it('renders the board at full size without a measurement', () => {
    const wrapper = shallowMount(ScaledBoard, {...globalConfig, props: {spaces: [], boardName: BoardName.THARSIS}});
    expect(wrapper.findComponent({name: 'Board'}).exists()).to.be.true;
    expect((wrapper.vm as any).scale).eq(1);
  });
});
