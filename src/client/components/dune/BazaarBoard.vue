<template>
  <!-- Board tab "Bazaar" (Dune module A): the five slots from the newest (dearest) to the oldest (cheapest).
       A ware slides one slot right each generation; one fewer ware than players lies out. -->
  <div class="dune-bazaar" data-test="dune-bazaar">
    <ol class="dune-bazaar__slots">
      <!-- Like the bazaar board of the mockup: the price change above each slot, the ware as a small card with its price
           coin in the corner, a scene and its goods -->
      <li v-for="(slot, index) in bazaar.slots" :key="index" class="dune-bazaar__place" :data-test="'dune-bazaar-slot-' + index">
        <span class="dune-bazaar__change">{{ priceChange(index) }}</span>
        <!-- Buying is an action: a tap on an affordable ware opens its purchase as an action tab (payment with
             before/after and cancel); a ware that can't be bought now is greyed out (Jens, 19 Oct 2026) -->
        <component :is="buyable(slot.ware) ? 'button' : 'div'" v-if="slot.ware !== undefined" :type="buyable(slot.ware) ? 'button' : undefined"
          :class="['dune-bazaar__slot', buyable(slot.ware) ? 'dune-bazaar__slot--buyable' : 'dune-bazaar__slot--unavailable']" :title="buyable(slot.ware) ? $t('Buy this ware') : undefined"
          @click="buyable(slot.ware) && buy(slot.ware)">
          <BazaarWareCard :ware="slot.ware" :price="slot.price"/>
        </component>
        <div v-else class="dune-bazaar__slot dune-bazaar__slot--empty">{{ $t('Empty') }}</div>
      </li>
    </ol>
    <div class="dune-bazaar__footer">
      <span v-if="bazaar.buyers.length > 0" class="dune-bazaar__buyers">
        {{ $t('Buying order') }}:
        <span v-for="color in bazaar.buyers" :key="color" :class="['dune-bazaar__buyer', 'player_bg_color_' + color]">{{ playerName(color) }}</span>
      </span>
      <span v-if="bought.length > 0" class="dune-bazaar__buyers">
        {{ $t('Bought this generation') }}:
        <span v-for="color in bought" :key="color" :class="['dune-bazaar__buyer', 'player_bg_color_' + color]">{{ playerName(color) }}</span>
      </span>
    </div>
    <!-- The rules as short cards instead of a block of text -->
    <DuneRuleCards :rules="BAZAAR_RULES"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {BazaarModel} from '@/common/dune/DuneModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {BAZAAR_SLOT_PRICE_CHANGE} from '@/common/dune/bazaarWares';
import {vueRoot} from '@/client/components/vueRoot';
import {closeMove, DuneMoveStep, isMoveOffered, openMove} from './duneMoves';
import DuneRuleCards from './DuneRuleCards.vue';
import BazaarWareCard from './BazaarWareCard.vue';
import {BAZAAR_RULES} from './duneRules';
import {BAZAAR_BUY_TITLE, BAZAAR_WARE_TITLE} from '@/common/dune/duneActionTitles';
import {requestActionTab} from '@/client/components/actionTabRequest';

// Purchase of a ware in the action menu: an action tab of its own (server Bazaar.ts bazaarTabActions)
function wareTab(ware: string): Array<DuneMoveStep> {
  return [{title: BAZAAR_BUY_TITLE, value: ware}];
}

// Purchase in the bazaar round of the former rules (games saved back then): still made below the bazaar
function wareMove(ware: string): Array<DuneMoveStep> {
  return [{title: BAZAAR_WARE_TITLE, value: ware}];
}

export default defineComponent({
  name: 'BazaarBoard',
  components: {DuneRuleCards, BazaarWareCard},
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
    BAZAAR_RULES(): typeof BAZAAR_RULES {
      return BAZAAR_RULES;
    },
    // Games saved before buying became an action have no list
    bought(): ReadonlyArray<Color> {
      return this.bazaar.bought ?? [];
    },
  },
  methods: {
    priceChange(slot: number): string {
      const change = BAZAAR_SLOT_PRICE_CHANGE[slot] ?? 0;
      return change > 0 ? `+${change}` : change < 0 ? `−${-change}` : '±0';
    },
    // Whether the waiting input offers this ware right now (action tab or bazaar round)
    buyable(ware: string): boolean {
      const waitingFor = vueRoot(this).playerView?.waitingFor;
      return isMoveOffered(waitingFor, wareTab(ware)) || isMoveOffered(waitingFor, wareMove(ware));
    },
    // Opens the purchase as an action tab; in a bazaar round of the former rules below the bazaar (DuneMovePanel.vue)
    buy(ware: string): void {
      if (isMoveOffered(vueRoot(this).playerView?.waitingFor, wareTab(ware))) {
        closeMove();
        requestActionTab(BAZAAR_BUY_TITLE, ware);
      } else {
        openMove('bazaar', wareMove(ware));
      }
    },
    playerName(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
  },
});
</script>
