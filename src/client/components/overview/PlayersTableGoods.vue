<template>
  <div class="players-table-cell">
    <!-- Goods box: stock large (that's what you look at), production as second value, value per unit as a coin at the corner -->
    <div :class="boxClasses">
      <!-- Shield before the stock: protected amounts stand out as a white area with a black number -->
      <span class="players-table-goods-stock" data-test="stock" v-flash-count="flashKeys.playerStock(color, good.type)"><span v-if="protectionIcon !== ''" :class="['players-table-protection', protectionIcon]" data-test="protection"></span>{{ good.count }}</span>
      <span :class="productionClasses" data-test="production" v-flash="flashKeys.playerProduction(color, good.type)" :data-tooltip="$t('Production count')">{{ productionText }}</span>
      <span v-if="showValue" class="players-table-goods-value" data-test="value">{{ good.value }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerGood, shouldShowResourceValue} from '@/client/components/overview/playerGoods';
import {Color} from '@/common/Color';
import {vFlash} from '@/client/directives/ChangeFlash';
import {vFlashCount} from '@/client/directives/ChangeFlashCount';
import {flashKeys} from '@/client/utils/changeFlashKeys';

export default defineComponent({
  name: 'PlayersTableGoods',
  directives: {
    flash: vFlash,
    flashCount: vFlashCount,
  },
  props: {
    good: {
      type: Object as () => PlayerGood,
      required: true,
    },
    // Owner of the goods: key of the blink after another player's move (changeFlashKeys.ts)
    color: {
      type: String as () => Color,
      required: true,
    },
    // Sole highest production at the table – gets highlighted
    isProductionLeader: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    flashKeys(): typeof flashKeys {
      return flashKeys;
    },
    boxClasses(): Array<string> {
      const classes = ['players-table-goods', 'players-table-goods--' + this.good.type];
      if (this.good.count === 0) {
        classes.push('players-table-goods--empty');
      }
      if (this.protectionIcon !== '') {
        classes.push('players-table-protected');
      }
      return classes;
    },
    productionText(): string {
      return this.good.production > 0 ? `+${this.good.production}` : `${this.good.production}`;
    },
    productionClasses(): Array<string> {
      const classes = ['players-table-goods-production', 'tooltip', 'tooltip-bottom'];
      if (this.good.production === 0) {
        classes.push('players-table-goods-production--none');
      } else if (this.isProductionLeader) {
        classes.push('players-table-goods-production--leader');
      }
      return classes;
    },
    showValue(): boolean {
      return shouldShowResourceValue(this.good.type, this.good.value);
    },
    // Protection (e.g. via cards against attacks) as a small shield, as in the classic bar
    protectionIcon(): string {
      if (this.good.resourceProtection === 'on' || this.good.productionProtection === 'on') {
        return 'shield_icon';
      }
      if (this.good.resourceProtection === 'half') {
        return 'shield_icon_half';
      }
      return '';
    },
  },
});
</script>
