<template>
  <!-- Board tab "Bazaar" (Dune module A): the five slots from the newest (dearest) to the oldest (cheapest).
       A ware slides one slot right each generation; one fewer ware than players lies out. -->
  <div class="dune-bazaar" data-test="dune-bazaar">
    <ol class="dune-bazaar__slots">
      <!-- Like the bazaar board of the mockup: the price change above each slot, the ware as a small card with its price
           coin in the corner, a scene and its goods -->
      <li v-for="(slot, index) in bazaar.slots" :key="index" class="dune-bazaar__place" :data-test="'dune-bazaar-slot-' + index">
        <span class="dune-bazaar__change">{{ priceChange(index) }}</span>
        <div v-if="slot.ware !== undefined" class="dune-bazaar__slot">
          <span class="dune-bazaar__price"><img :src="coinIcon" alt=""><b>{{ slot.price }}</b></span>
          <span class="dune-bazaar__name">{{ $t(slot.ware) }}</span>
          <img class="dune-bazaar__scene" :src="scene(slot.ware)" alt="">
          <span class="dune-bazaar__goods">
            <span v-for="good in goods(slot.ware)" :key="good.good" class="dune-bazaar__good">
              <b>{{ good.amount }}</b><img :src="good.icon" :alt="$t(good.label)" :title="$t(good.label)">
            </span>
          </span>
        </div>
        <div v-else class="dune-bazaar__slot dune-bazaar__slot--empty">{{ $t('Empty') }}</div>
      </li>
    </ol>
    <div class="dune-bazaar__footer">
      <span v-if="bazaar.buyers.length > 0" class="dune-bazaar__buyers">
        {{ $t('Buying order') }}:
        <span v-for="color in bazaar.buyers" :key="color" :class="['dune-bazaar__buyer', 'player_bg_color_' + color]">{{ playerName(color) }}</span>
      </span>
      <span class="dune-bazaar__hint">{{ $t('Each generation after research the lowest TR buys first, at most one ware each. The owner of the Commercial District buys first and pays 2 M€ less.') }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {BazaarModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {BAZAAR_SLOT_PRICE_CHANGE, BazaarGood, bazaarWare} from '@/common/dune/bazaarWares';
import {themedAsset} from '@/client/theme/themeDisplay';
import {duneGraphic} from './duneGraphic';

// Picture and name of each good; the Dune theme swaps the pictures (src/themes/dune/graphics.json)
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

const GOOD_DISPLAY: Record<BazaarGood, {icon: string, label: string}> = {
  steel: {icon: 'assets/resources/steel.png', label: 'Steel'},
  titanium: {icon: 'assets/resources/titanium.png', label: 'Titanium'},
  plants: {icon: 'assets/resources/plant.png', label: 'Plants'},
  energy: {icon: 'assets/resources/power.png', label: 'Energy'},
  heat: {icon: 'assets/resources/heat.png', label: 'Heat'},
  cards: {icon: 'assets/resources/card.png', label: 'Cards'},
  tr: {icon: 'assets/resources/tr.png', label: 'TR'},
};

export default defineComponent({
  name: 'BazaarBoard',
  props: {
    bazaar: {
      type: Object as PropType<BazaarModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  computed: {
    coinIcon(): string {
      return themedAsset('assets/resources/megacredit.png');
    },
  },
  methods: {
    priceChange(slot: number): string {
      const change = BAZAAR_SLOT_PRICE_CHANGE[slot] ?? 0;
      return change > 0 ? `+${change}` : change < 0 ? `−${-change}` : '±0';
    },
    goods(ware: string): Array<{good: BazaarGood, amount: number, icon: string, label: string}> {
      return (Object.entries(bazaarWare(ware).content) as Array<[BazaarGood, number]>)
        .map(([good, amount]) => ({good, amount, icon: themedAsset(GOOD_DISPLAY[good].icon), label: GOOD_DISPLAY[good].label}));
    },
    scene(ware: string): string {
      const first = Object.keys(bazaarWare(ware).content)[0] as BazaarGood;
      return duneGraphic(GOOD_SCENE[first]);
    },
    playerName(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
  },
});
</script>
