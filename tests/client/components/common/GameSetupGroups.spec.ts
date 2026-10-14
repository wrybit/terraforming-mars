import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GameSetupGroups from '@/client/components/common/GameSetupGroups.vue';
import {boardChip, expansionChips, groupSetupChips, optionChips, seatChips} from '@/client/components/common/gameSetupChips';
import {setupOptionsFromGame} from '@/common/game/GameSetupOptions';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';

function gameOptions(options: Partial<GameOptionsModel>): GameOptionsModel {
  return {startingCorporations: 4, startingPreludes: 4, startingCeos: 3, ...options} as GameOptionsModel;
}

describe('GameSetupGroups', () => {
  const options = setupOptionsFromGame(gameOptions({
    shuffleMapOption: true, draftVariant: true, undoOption: true, aiAnalysis: true, aresExtremeVariant: true,
    randomMA: RandomMAOptionType.LIMITED,
  }));
  const isActive = (expansion: string) => expansion === 'ares';
  const chips = [...seatChips(2, 1), boardChip('tharsis'), ...expansionChips(isActive), ...optionChips(options, isActive, 3)];

  it('sorts the chips into the cards of the create form and leaves empty cards out', () => {
    expect(groupSetupChips(chips).map((group) => [group.title, group.chips.map((chip) => chip.label)])).deep.eq([
      ['Players', ['2 players', '1 AI', 'Analysis game']],
      ['Expansions', ['Base game', 'Ares']],
      ['Expansion options', ['Extreme']],
      ['Board', ['tharsis', 'Randomize board tiles']],
      ['Setup', ['Draft']],
      ['House-rule variants & pace', ['Allow undo']],
      ['Milestones & Awards', ['Random limited']],
    ]);
  });

  it('renders every group with its title and chips', () => {
    const wrapper = mount(GameSetupGroups, {...globalConfig, props: {chips}});
    expect(wrapper.findAll('.game-setup-group__title').map((title) => title.text())).to.have.length(7);
    expect(wrapper.findAll('.game-setup-group').at(0)?.findAll('.create-game-summary-chip').map((chip) => chip.text()))
      .deep.eq(['2 players', '1 AI', 'Analysis game']);
  });
});
