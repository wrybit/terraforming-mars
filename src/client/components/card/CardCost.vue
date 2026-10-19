<template>
  <div>
    <div class="card-cost" :class="{'visibility-hidden': amount === undefined}">{{ amount }}</div>
    <template v-if="displayTwoCosts">
      <!-- Discount: printed cost small and pale, the chevron, the own cost large beside it (cards_v2.less) -->
      <DiscountChevron class="card-cost-transition"/>
      <div class="card-old-cost">{{ newCost }}</div>
    </template>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import DiscountChevron from '@/client/components/common/DiscountChevron.vue';
import {getPreferences} from '@/client/utils/PreferencesManager';

export default defineComponent({
  name: 'CardCost',
  components: {DiscountChevron},
  props: {
    amount: {
      type: Number as () => number | undefined,
      default: undefined,
    },
    newCost: {
      type: Number as () => number | undefined,
      default: undefined,
    },
  },
  computed: {
    displayTwoCosts(): boolean {
      const hideDiscount = getPreferences().hide_discount_on_cards;
      return this.newCost !== undefined && this.newCost !== this.amount && !hideDiscount;
    },
  },
});

</script>

