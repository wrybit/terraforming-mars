import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';

describe('PlayerCube', () => {
  it('renders large cubes live with six faces, color and view classes', () => {
    const wrapper = shallowMount(PlayerCube, {
      ...globalConfig,
      props: {color: 'red', view: 'top', size: 40, spin: 30},
    });
    const cube = wrapper.find('.player-cube');
    expect(cube.classes()).to.include.members(['player-cube--red', 'player-cube--top']);
    expect(wrapper.findAll('.player-cube-face')).to.have.length(6);
    const style = cube.attributes('style') ?? '';
    expect(style).to.contain('--cube-size: 40px');
    expect(style).to.contain('--cube-turn: 30deg');
  });

  it('shows small cubes as a picture from the sprite sheet', () => {
    const wrapper = shallowMount(PlayerCube, {...globalConfig, props: {color: 'green', view: 'top', size: 14, spin: 20}});
    const cube = wrapper.find('.player-cube');
    expect(cube.classes()).to.include('player-cube--sprite');
    expect(wrapper.findAll('.player-cube-face')).to.have.length(0);
    const style = cube.attributes('style') ?? '';
    expect(style).to.contain('--sprite-row: 1');
    expect(style).to.contain('--sprite-column: 2');
  });

  it('softens reflections on small live cubes', () => {
    const small = shallowMount(PlayerCube, {...globalConfig, props: {color: 'blue', view: 'iso', size: 16, spin: 10}});
    const large = shallowMount(PlayerCube, {...globalConfig, props: {color: 'blue', size: 80}});
    expect(small.find('.player-cube').attributes('style')).to.contain('--detail: 0.2');
    expect(large.find('.player-cube').attributes('style')).to.contain('--detail: 1');
  });

  it('marks the cube as animated only when asked', () => {
    const still = shallowMount(PlayerCube, {...globalConfig, props: {color: 'red'}});
    const animated = shallowMount(PlayerCube, {...globalConfig, props: {color: 'red', animated: true}});
    expect(still.find('.player-cube').classes()).to.not.include('player-cube--animated');
    expect(animated.find('.player-cube').classes()).to.include('player-cube--animated');
  });
});
