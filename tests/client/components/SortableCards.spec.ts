import {mount, VueWrapper} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import SortableCards from '@/client/components/SortableCards.vue';
import {CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {FakeLocalStorage} from './FakeLocalStorage';
import {handSortOrder, resetHandSort, sortHand} from '@/client/utils/handSort';
import {SortOrder} from '@/client/utils/SortOrder';

/**
 * Drag card at `sourceIndex` onto the card at `targetIndex`; it takes that card's place.
 */
async function dragCard(sortable: VueWrapper<InstanceType<typeof SortableCards>>, sourceIndex: number, targetIndex: number) {
  const slots = sortable.findAll('.sortable-slot');

  // jsdom hat kein Layout: Karten liegen simuliert nebeneinander, je 10px breit.
  slots.forEach((slot, index) => {
    slot.element.getBoundingClientRect = () => {
      return {left: index * 10, top: 0, width: 10, height: 10} as DOMRect;
    };
  });

  const startX = sourceIndex * 10 + 5;
  const targetX = targetIndex * 10 + 5;
  slots[sourceIndex].element.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, clientX: startX, clientY: 5}));
  window.dispatchEvent(new MouseEvent('pointermove', {clientX: targetX, clientY: 5}));
  await sortable.vm.$nextTick();
  window.dispatchEvent(new MouseEvent('pointerup', {clientX: targetX, clientY: 5}));
  await sortable.vm.$nextTick();
}

/**
 * Returns the names of cards in this widget in their current order.
 */
function cardsInOrder(sortable: VueWrapper<InstanceType<typeof SortableCards>>): Array<CardName> {
  return sortable.findAllComponents({
    name: 'Card',
  }).map((card) => card.props().card.name);
}


// Sortierung läuft über den gemeinsamen Zustand (handSort.ts), den auch die Sortierleiste nutzt
async function sortBy(sortable: VueWrapper<InstanceType<typeof SortableCards>>, sortOrder: SortOrder | undefined) {
  sortHand('player1', sortable.props('cards'), sortOrder);
  await sortable.vm.$nextTick();
}

describe('SortableCards', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
    resetHandSort();
  });
  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  it('allows sorting after initial loading with no local storage', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}],
        playerId: 'player1',
      },
    });
    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ANTS, CardName.CARTEL]);

    await dragCard(sortable, 0, 1);

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.CARTEL, CardName.ANTS]);
    // Nach dem Loslassen bleibt weder schwebende Karte noch Platzhalter zurück.
    expect(sortable.find('.sortable-ghost').exists()).is.false;
    expect(sortable.find('.sortable-placeholder').exists()).is.false;
    expect(CardOrderStorage.getCardOrder('player1')).to.deep.eq({
      [CardName.ANTS]: 2,
      [CardName.CARTEL]: 1,
    });
  });

  it('puts new cards at end of order and removes old', async () => {
    CardOrderStorage.updateCardOrder('player1', {
      [CardName.ANTS]: 2,
      [CardName.CARTEL]: 1,
      [CardName.DECOMPOSERS]: 3,
    });
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}, {name: CardName.BIRDS}],
        playerId: 'player1',
      },
    });

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.CARTEL, CardName.ANTS, CardName.BIRDS]);

    await dragCard(sortable, 0, 2);

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ANTS, CardName.BIRDS, CardName.CARTEL]);
    expect(CardOrderStorage.getCardOrder('player1')).to.deep.eq({
      [CardName.ANTS]: 1,
      [CardName.BIRDS]: 2,
      [CardName.CARTEL]: 3,
    });
  });

  it('has no reorder checkbox', () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}],
        playerId: 'player1',
      },
    });
    expect(sortable.find('input[type=checkbox]').exists()).is.false;
  });

  it('ignores small pointer movements (click, not drag)', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}],
        playerId: 'player1',
      },
    });
    sortable.findAll('.sortable-slot')[0].element.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, clientX: 5, clientY: 5}));
    window.dispatchEvent(new MouseEvent('pointermove', {clientX: 7, clientY: 5}));
    await sortable.vm.$nextTick();
    expect(sortable.find('.sortable-placeholder').exists()).is.false;
    window.dispatchEvent(new MouseEvent('pointerup', {clientX: 7, clientY: 5}));
    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ANTS, CardName.CARTEL]);
  });

  it('ignores a card that is only visually under the pointer while sliding away', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}],
        playerId: 'player1',
      },
    });
    const slots = sortable.findAll('.sortable-slot');
    slots[0].element.getBoundingClientRect = () => ({left: 0, top: 0, width: 10, height: 10} as DOMRect);
    // CARTEL gleitet gerade von links nach rechts: sichtbar bei 0, eigentlicher Platz bei 10
    const sliding = slots[1].element as HTMLElement;
    sliding.getBoundingClientRect = () => ({left: 0, top: 0, width: 10, height: 10} as DOMRect);
    sliding.style.transform = 'matrix(1, 0, 0, 1, -10, 0)';

    slots[0].element.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, clientX: 2, clientY: 5}));
    window.dispatchEvent(new MouseEvent('pointermove', {clientX: 9, clientY: 5}));
    await sortable.vm.$nextTick();
    window.dispatchEvent(new MouseEvent('pointerup', {clientX: 9, clientY: 5}));

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ANTS, CardName.CARTEL]);
  });

  it('sorts by cost', async () => {
    // Ants: 9, Cartel: 8, Birds: 10
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}, {name: CardName.BIRDS}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'cost', reversed: false});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.CARTEL, CardName.ANTS, CardName.BIRDS]);
    expect(CardOrderStorage.getCardOrder('player1')).to.deep.eq({
      [CardName.CARTEL]: 1,
      [CardName.ANTS]: 2,
      [CardName.BIRDS]: 3,
    });
  });

  it('sorts in reverse', async () => {
    // Ants: 9, Cartel: 8, Birds: 10
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}, {name: CardName.BIRDS}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'cost', reversed: true});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.BIRDS, CardName.ANTS, CardName.CARTEL]);
  });

  it('dragging a card clears the sort', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'cost', reversed: false});
    await dragCard(sortable, 0, 1);

    expect(handSortOrder()).is.undefined;
  });

  it('sorts by cost, preferring calculated cost', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.BIRDS, calculatedCost: 2}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'cost', reversed: false});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.BIRDS, CardName.ANTS]);
  });

  it('sorts by type', async () => {
    // Asteroid: event, Ants: active, Cartel: automated (8), Mine: automated (4)
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ASTEROID}, {name: CardName.ANTS}, {name: CardName.CARTEL}, {name: CardName.MINE}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'type', reversed: false});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.MINE, CardName.CARTEL, CardName.ANTS, CardName.ASTEROID]);
  });

  it('sorts by type, corporations and preludes first', async () => {
    // Asteroid: event, Mine: automated, Donation: prelude, Ecoline: corporation
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ASTEROID}, {name: CardName.MINE}, {name: CardName.DONATION}, {name: CardName.ECOLINE}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'type', reversed: false});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ECOLINE, CardName.DONATION, CardName.MINE, CardName.ASTEROID]);
  });

  it('sorts by resource', async () => {
    // Cartel: none, Birds: animal, Ants: microbe (9), Tardigrades: microbe (4)
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.CARTEL}, {name: CardName.BIRDS}, {name: CardName.ANTS}, {name: CardName.TARDIGRADES}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'resource', reversed: false});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.BIRDS, CardName.TARDIGRADES, CardName.ANTS, CardName.CARTEL]);
  });

  it('sorts by vp', async () => {
    // Nuclear Zone: -2, Cartel: 0, Ants: variable, Asteroid Mining: 2
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.NUCLEAR_ZONE}, {name: CardName.CARTEL}, {name: CardName.ANTS}, {name: CardName.ASTEROID_MINING}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'vp', reversed: false});

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ASTEROID_MINING, CardName.ANTS, CardName.CARTEL, CardName.NUCLEAR_ZONE]);
  });

  it('manual restores the own order after sorting', async () => {
    // Ants: 9, Cartel: 8, Birds: 10 – eigene Reihenfolge Birds, Ants, Cartel
    CardOrderStorage.updateCardOrder('player1', {[CardName.BIRDS]: 1, [CardName.ANTS]: 2, [CardName.CARTEL]: 3});
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}, {name: CardName.BIRDS}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'cost', reversed: false});
    expect(cardsInOrder(sortable)).to.deep.eq([CardName.CARTEL, CardName.ANTS, CardName.BIRDS]);
    await sortBy(sortable, {key: 'cost', reversed: true});
    await sortBy(sortable, undefined);

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.BIRDS, CardName.ANTS, CardName.CARTEL]);
  });

  it('keeps the dragged order when dragging clears the sort', async () => {
    const sortable = mount(SortableCards, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ANTS}, {name: CardName.CARTEL}, {name: CardName.BIRDS}],
        playerId: 'player1',
      },
    });

    await sortBy(sortable, {key: 'cost', reversed: false});
    // Cartel, Ants, Birds -> Cartel auf Birds ziehen
    await dragCard(sortable, 0, 2);
    await sortBy(sortable, undefined);

    expect(cardsInOrder(sortable)).to.deep.eq([CardName.ANTS, CardName.BIRDS, CardName.CARTEL]);
  });
});
