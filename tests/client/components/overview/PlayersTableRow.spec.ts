import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayersTableRow from '@/client/components/overview/PlayersTableRow.vue';
import {buildTagDetails, handDiscountLabel, TagDetails} from '@/client/components/overview/playerTagDetails';
import {Tag} from '@/common/cards/Tag';
import {CardName} from '@/common/cards/CardName';
import {Color} from '@/common/Color';
import {emptyTags, fakeGameModel, fakePublicPlayerModel, fakeViewModel} from '../testHelpers';

function mountRow(options: {showOtherPlayersVP: boolean, setVisibilityState?: (key: string, value: boolean) => void, firstForGen?: boolean, actionLabel?: 'passed' | 'active', extraTableau?: Array<CardName>}) {
  const me = fakePublicPlayerModel({color: 'blue' as Color});
  const other = fakePublicPlayerModel({
    color: 'red' as Color,
    name: 'Daniel',
    terraformRating: 24,
    cardsInHandNbr: 10,
    tags: {...emptyTags(), [Tag.BUILDING]: 8},
    tableau: [{name: CardName.SATURN_SYSTEMS}, {name: CardName.ACQUIRED_COMPANY}, ...(options.extraTableau ?? []).map((name) => ({name}))],
  });
  const playerView = fakeViewModel({
    players: [other, me],
    thisPlayer: me,
    game: fakeGameModel({gameOptions: {showOtherPlayersVP: options.showOtherPlayersVP}}),
  });
  return shallowMount(PlayersTableRow, {
    ...globalConfig,
    global: {
      ...globalConfig.global,
      mocks: {
        getVisibilityState: () => false,
        setVisibilityState: options.setVisibilityState ?? (() => {}),
      },
    },
    props: {
      player: other,
      playerView,
      actionLabel: options.actionLabel ?? 'passed',
      firstForGen: options.firstForGen ?? false,
      playerIndex: 0,
      visibility: {goods: true, tags: true, score: true},
      tagColumns: [[Tag.BUILDING, Tag.SCIENCE, Tag.EARTH]],
      tagDetails: buildTagDetails(other, playerView),
    },
  });
}

describe('PlayersTableRow', () => {
  it('shows score counters, tags and played cards', () => {
    const wrapper = mountRow({showOtherPlayersVP: false});
    expect(wrapper.find('[data-test="vp"]').text()).to.eq('?');
    expect(wrapper.find('[data-test="tr"]').text()).to.eq('24');
    expect(wrapper.find('[data-test="hand"]').text()).to.eq('10');
    expect(wrapper.find('[data-test="tag-building"]').text()).to.eq('8');
    expect(wrapper.find('[data-test="played-cards"]').text()).to.eq('2');
  });

  it('shows a tag substitution marker (Earth Embassy)', () => {
    expect(mountRow({showOtherPlayersVP: false}).find('[data-test="substitution-earth"]').exists()).to.eq(false);
    const wrapper = mountRow({showOtherPlayersVP: false, extraTableau: [CardName.EARTH_EMBASSY]});
    expect(wrapper.find('[data-test="substitution-earth"]').exists()).to.eq(true);
    expect(wrapper.find('[data-test="substitution-science"]').exists()).to.eq(false);
  });

  it('marks the hand discount when cards give conditional discounts (Cutting Edge Technology)', () => {
    expect(mountRow({showOtherPlayersVP: false}).find('[data-test="discount-all"]').exists()).to.eq(false);
    const wrapper = mountRow({showOtherPlayersVP: false, extraTableau: [CardName.CUTTING_EDGE_TECHNOLOGY]});
    const badge = wrapper.find('[data-test="discount-all"]');
    expect(badge.text()).to.eq('*');
    expect(badge.attributes('title')).to.contain('cards with requirements');
  });

  it('labels the hand discount as -1* (discount for every card plus conditional discounts)', () => {
    const details = (all: number, conditional: number): TagDetails => ({
      all: {name: 'all', discount: all, points: 0, halfPoints: 0, count: 0, asterisk: false},
      tagsInOrder: [],
      conditionalDiscounts: Array(conditional).fill({source: CardName.CUTTING_EDGE_TECHNOLOGY, amount: 2, appliesTo: 'cards with requirements'}),
    });
    expect(handDiscountLabel(details(1, 1))).to.eq('-1*');
    expect(handDiscountLabel(details(1, 0))).to.eq('-1');
    expect(handDiscountLabel(details(0, 1))).to.eq('*');
    expect(handDiscountLabel(details(0, 0))).to.eq('');
  });

  it('shows other players victory points when the game allows it', () => {
    const wrapper = mountRow({showOtherPlayersVP: true});
    expect(wrapper.find('[data-test="vp"]').text()).to.eq('20');
  });

  it('opens the played cards on click', async () => {
    const calls: Array<[string, boolean]> = [];
    const wrapper = mountRow({showOtherPlayersVP: false, setVisibilityState: (key, value) => calls.push([key, value])});
    await wrapper.trigger('click');
    expect(calls).to.deep.include(['pinned_player_0', true]);
  });

  it('shows the first player in the color bar and hands the status to the player head', () => {
    const wrapper = mountRow({showOtherPlayersVP: false, firstForGen: true, actionLabel: 'active'});
    expect(wrapper.find('[data-test="first-player"]').text()).to.eq('1');
    expect(wrapper.findComponent({name: 'PlayerIdentity'}).props('actionLabel')).to.eq('active');
    expect(mountRow({showOtherPlayersVP: false}).find('[data-test="first-player"]').exists()).to.be.false;
  });
});
