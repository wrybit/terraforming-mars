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

  it('grows up to maxScale on a wide container', () => {
    const wrapper = shallowMount(ScaledBoard, {...globalConfig, props: {spaces: [], boardName: BoardName.THARSIS, maxScale: 2}});
    const vm = wrapper.vm as any;
    vm.naturalWidth = 400;
    Object.defineProperty(vm.$refs.root, 'clientWidth', {value: 1000});
    vm.fitToWidth();
    expect(vm.scale).eq(2);
  });

  it('never grows beyond 1 by default', () => {
    const wrapper = shallowMount(ScaledBoard, {...globalConfig, props: {spaces: [], boardName: BoardName.THARSIS}});
    const vm = wrapper.vm as any;
    vm.naturalWidth = 400;
    Object.defineProperty(vm.$refs.root, 'clientWidth', {value: 1000});
    vm.fitToWidth();
    expect(vm.scale).eq(1);
  });

  it('keeps the planet within maxPlanetShare of the container', () => {
    const wrapper = shallowMount(ScaledBoard, {...globalConfig, props: {spaces: [], boardName: BoardName.THARSIS, planetOnly: true, maxScale: 2, maxPlanetShare: 0.9}});
    const vm = wrapper.vm as any;
    vm.naturalWidth = 449;
    Object.defineProperty(vm.$refs.root, 'clientWidth', {value: 449});
    vm.fitToWidth();
    expect(vm.scale).to.be.closeTo(0.9, 0.001);
  });
});
