import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTableTagTooltip from '@/client/components/overview/PlayersTableTagTooltip.vue';
import {buildTagDetails} from '@/client/components/overview/playerTagDetails';
import {columnTotal, countsTowardPlayerTotal, playerTagTotal, tagTooltipPosition} from '@/client/components/overview/playersTableTagSums';
import {SpecialTags} from '@/client/cards/SpecialTags';
import {Tag} from '@/common/cards/Tag';
import {Color} from '@/common/Color';
import {emptyTags, fakePublicPlayerModel, fakeViewModel} from '../testHelpers';

function detailsOfTwoPlayers() {
  const blue = fakePublicPlayerModel({color: 'blue' as Color, noTagsCount: 4,
    tags: {...emptyTags(), [Tag.SCIENCE]: 2, [Tag.CITY]: 3, [Tag.EVENT]: 5, [Tag.WILD]: 1}});
  const red = fakePublicPlayerModel({color: 'red' as Color, tags: {...emptyTags(), [Tag.SCIENCE]: 4}});
  const playerView = fakeViewModel({players: [blue, red], thisPlayer: blue});
  return [buildTagDetails(blue, playerView), buildTagDetails(red, playerView)];
}

describe('PlayersTableTagTooltip', () => {
  it('sums a player\'s tags with event and wild, without city and no tag', () => {
    const [blue] = detailsOfTwoPlayers();
    expect(playerTagTotal(blue)).to.eq(2 + 5 + 1);
    expect(countsTowardPlayerTotal(Tag.CITY)).is.false;
    expect(countsTowardPlayerTotal(SpecialTags.NONE)).is.false;
    expect(countsTowardPlayerTotal(Tag.EVENT)).is.true;
  });

  it('sums a column across all players', () => {
    const details = detailsOfTwoPlayers();
    expect(columnTotal(Tag.SCIENCE, details)).to.eq(6);
    expect(columnTotal(SpecialTags.NONE, details)).to.eq(4);
  });

  it('hangs below and right of the pointer and switches sides at the window edge', () => {
    const size = {width: 160, height: 80};
    const viewport = {width: 1000, height: 700};
    expect(tagTooltipPosition({x: 100, y: 100}, size, viewport)).to.deep.eq({left: 114, top: 118});
    expect(tagTooltipPosition({x: 950, y: 650}, size, viewport)).to.deep.eq({left: 950 - 14 - 160, top: 650 - 18 - 80});
  });

  it('shows both sums and the player', () => {
    const wrapper = mount(PlayersTableTagTooltip, {
      ...globalConfig,
      global: {...globalConfig.global, stubs: {teleport: true}},
      props: {tag: Tag.SCIENCE, color: 'blue' as Color, playerName: 'Ada', columnTotal: 6, playerTotal: 8, pointerX: 10, pointerY: 10},
    });
    expect(wrapper.find('[data-test=column-total]').text()).to.eq('6');
    expect(wrapper.find('[data-test=player-total]').text()).to.eq('8');
    expect(wrapper.text()).to.include('Ada');
  });
});
