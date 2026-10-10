import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import {boardChip, draftChips, expansionChips, seatChips} from '@/client/components/common/gameSetupChips';

describe('GameSetupChips', () => {
  it('shows players, board, expansions and draft in this order', () => {
    const chips = [
      ...seatChips(2, 1),
      boardChip('tharsis'),
      ...expansionChips((expansion) => expansion === 'venus'),
      ...draftChips(3, true),
    ];
    const wrapper = mount(GameSetupChips, {...globalConfig, props: {chips, compact: true}});
    expect(wrapper.findAll('.create-game-summary-chip').map((chip) => chip.text())).deep.eq(['2 players', '1 AI', 'tharsis', 'Base game', 'Venus Next', 'Draft']);
    expect(wrapper.classes()).to.include('create-game-summary--compact');
  });

  it('a single human is a solo game, draft only counts with more players', () => {
    expect(seatChips(1, 0).map((chip) => chip.label)).deep.eq(['Solo']);
    expect(draftChips(1, true)).deep.eq([]);
  });
});
