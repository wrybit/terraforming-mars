import {expect} from 'chai';
import {computed} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {FakeLocalStorage} from '../components/FakeLocalStorage';

describe('CardOrderStorage', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });
  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  // Bauen- und Verkaufen-Dialog bleiben gemountet, während die Hand umsortiert wird.
  it('is reactive: readers see a new order without remount', () => {
    const cards = [{name: CardName.ANTS}, {name: CardName.CARTEL}];
    const ordered = computed(() => CardOrderStorage.getOrdered(CardOrderStorage.getCardOrder('player1'), cards).map((card) => card.name));

    expect(ordered.value).to.deep.eq([CardName.ANTS, CardName.CARTEL]);

    CardOrderStorage.updateCardOrder('player1', {[CardName.ANTS]: 2, [CardName.CARTEL]: 1});

    expect(ordered.value).to.deep.eq([CardName.CARTEL, CardName.ANTS]);
  });
});
