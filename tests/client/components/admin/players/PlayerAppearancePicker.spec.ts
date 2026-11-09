import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerAppearancePicker from '@/client/components/admin/players/PlayerAppearancePicker.vue';
import {PlayerNameStats} from '@/client/components/admin/players/playerNameStats';

describe('PlayerAppearancePicker', () => {
  const player: PlayerNameStats = {name: 'Jens', games: 3, wins: 1, lastTimeMs: 0, color: 'red', oldNames: [], isBot: false};

  it('changes colour and emoji, reset goes back to the default look', async () => {
    const wrapper = mount(PlayerAppearancePicker, {...globalConfig, props: {player}, attachTo: document.body});
    await wrapper.find('.admin-players-look-button').trigger('click');
    const panel = document.querySelector('.admin-players-look-panel');
    expect(panel).is.not.null;
    (panel?.querySelectorAll('.create-game-swatch')[3] as HTMLElement).click();
    (panel?.querySelector('.lobby-emoji') as HTMLElement).click();
    await wrapper.vm.$nextTick();
    const [reset] = Array.from(document.querySelectorAll('.admin-players-look-actions button')) as Array<HTMLElement>;
    reset.click();
    expect(wrapper.emitted('change')).deep.eq([[{color: 'blue', emoji: undefined}], [{color: 'red', emoji: '🚀'}], [{}]]);
  });
});
