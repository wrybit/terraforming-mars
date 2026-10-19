import {BazaarGood, bazaarWare} from '@/common/dune/bazaarWares';
import {themedAsset} from '@/client/theme/themeDisplay';
import {duneGraphic} from './duneGraphic';

// How a ware of the bazaar looks: its goods with icon and name, and its picture. Shared by the bazaar board
// (BazaarBoard.vue) and the purchase in the action tab (BazaarPurchaseIntro.vue), so both show the same card.

// Picture of a ware after its first good, as in the mockup (data/bazaar-wares.js)
const GOOD_SCENE: Record<BazaarGood, string> = {
  heat: 'scene-oasis',
  energy: 'scene-power',
  titanium: 'scene-worm',
  steel: 'scene-building',
  plants: 'scene-plant',
  cards: 'scene-science',
  tr: 'scene-earth',
};

// Picture and name of each good; the Dune theme swaps the pictures (src/themes/dune/graphics.json)
const GOOD_DISPLAY: Record<BazaarGood, {icon: string, label: string}> = {
  steel: {icon: 'assets/resources/steel.png', label: 'Steel'},
  titanium: {icon: 'assets/resources/titanium.png', label: 'Titanium'},
  plants: {icon: 'assets/resources/plant.png', label: 'Plants'},
  energy: {icon: 'assets/resources/power.png', label: 'Energy'},
  heat: {icon: 'assets/resources/heat.png', label: 'Heat'},
  cards: {icon: 'assets/resources/card.png', label: 'Cards'},
  tr: {icon: 'assets/resources/tr.png', label: 'TR'},
};

export type WareGood = {good: BazaarGood, amount: number, icon: string, label: string};

export function wareGoods(ware: string): Array<WareGood> {
  return (Object.entries(bazaarWare(ware).content) as Array<[BazaarGood, number]>)
    .map(([good, amount]) => ({good, amount, icon: themedAsset(GOOD_DISPLAY[good].icon), label: GOOD_DISPLAY[good].label}));
}

export function wareScene(ware: string): string {
  const first = Object.keys(bazaarWare(ware).content)[0] as BazaarGood;
  return duneGraphic(GOOD_SCENE[first]);
}
