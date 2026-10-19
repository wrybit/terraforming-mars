<template>
  <!-- Face of a ware: price coin in the corner like the cost of a project card, name, picture and goods. The frame
       (.dune-bazaar__slot) comes from the caller: a button on the bazaar board, a plain card in the purchase tab -->
  <span class="dune-bazaar__price"><img :src="coinIcon" alt=""><b>{{ price }}</b></span>
  <span class="dune-bazaar__name">{{ $t(ware) }}</span>
  <img class="dune-bazaar__scene" :src="wareScene(ware)" alt="">
  <span class="dune-bazaar__goods">
    <span v-for="good in wareGoods(ware)" :key="good.good" class="dune-bazaar__good">
      <b>{{ good.amount }}</b><img :src="good.icon" :alt="$t(good.label)" :title="$t(good.label)">
    </span>
  </span>
</template>

<script setup lang="ts">
import {themedAsset} from '@/client/theme/themeDisplay';
import {wareGoods, wareScene} from './bazaarWareDisplay';

defineProps<{
  ware: string;
  price: number;
}>();

const coinIcon = themedAsset('assets/resources/megacredit.png');
</script>
