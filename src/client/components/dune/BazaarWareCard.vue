<template>
  <!-- Face of a ware: price coin in the corner like the cost of a project card, name, picture and goods. The frame
       (.dune-bazaar__slot) comes from the caller: a button on the bazaar board, a plain card in the purchase tab.
       With a discount (slot, bazaar tile, cards) the own price follows below the arrow, as on a project card
       (CardCost.vue, same "hide discount" preference) – Jens, 19 Oct 2026 -->
  <span class="dune-bazaar__price"><img :src="coinIcon" alt=""><b>{{ price }}</b></span>
  <template v-if="showsDiscount">
    <span class="dune-bazaar__price-arrow" aria-hidden="true"></span>
    <span class="dune-bazaar__price dune-bazaar__price--own"><img :src="coinIcon" alt=""><b>{{ newPrice }}</b></span>
  </template>
  <span class="dune-bazaar__name">{{ $t(ware) }}</span>
  <img class="dune-bazaar__scene" :src="wareScene(ware)" alt="">
  <span class="dune-bazaar__goods">
    <span v-for="good in wareGoods(ware)" :key="good.good" class="dune-bazaar__good">
      <b>{{ good.amount }}</b><img :src="good.icon" :alt="$t(good.label)" :title="$t(good.label)">
    </span>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {themedAsset} from '@/client/theme/themeDisplay';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {wareGoods, wareScene} from './bazaarWareDisplay';

const props = defineProps<{
  ware: string;
  // Printed price of the ware
  price: number;
  // What the viewer pays (slot and own discounts); same as price: nothing extra shown
  newPrice?: number;
}>();

const showsDiscount = computed(() => props.newPrice !== undefined && props.newPrice !== props.price && !getPreferences().hide_discount_on_cards);

const coinIcon = themedAsset('assets/resources/megacredit.png');
</script>
