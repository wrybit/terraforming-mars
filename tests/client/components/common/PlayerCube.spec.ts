import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';

describe('PlayerCube', () => {
  it('renders six faces with color and view classes', () => {
    const wrapper = shallowMount(PlayerCube, {
      ...globalConfig,
      props: {color: 'red', view: 'top', size: 22, spin: 30},
    });
    const cube = wrapper.find('.player-cube');
    expect(cube.classes()).to.include.members(['player-cube--red', 'player-cube--top']);
    expect(wrapper.findAll('.player-cube-face')).to.have.length(6);
    const style = cube.attributes('style') ?? '';
    expect(style).to.contain('--cube-size: 22px');
    expect(style).to.contain('--cube-turn: 30deg');
  });

  it('softens reflections on small cubes', () => {
    const small = shallowMount(PlayerCube, {...globalConfig, props: {color: 'blue', size: 16}});
    const large = shallowMount(PlayerCube, {...globalConfig, props: {color: 'blue', size: 80}});
    expect(small.find('.player-cube').attributes('style')).to.contain('--detail: 0.2');
    expect(large.find('.player-cube').attributes('style')).to.contain('--detail: 1');
  });
});
