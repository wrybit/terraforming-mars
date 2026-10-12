<template>
  <div class="players-table-cell">
    <!-- Goods box: stock large (that's what you look at), production as second value, value per unit as a coin at the corner -->
    <div :class="boxClasses" :style="boxStyle" data-flash-frame>
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
import {GOODS_BOX_WIDTH} from '@/client/components/overview/goodsBoxWidths';
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
    // Content width of the widest box in this column (goodsBoxWidths.ts): all boxes of the column match
    boxWidth: {
      type: Number,
      default: 0,
    },
    // Width of the widest production plaque of the column: the stock numbers of all rows end on one line
    productionWidth: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    flashKeys(): typeof flashKeys {
      return flashKeys;
    },
    boxStyle(): Record<string, string> {
      // Every box of the column is exactly as wide, also the own row with its larger font: the measured
      // content width is the floor for all rows, and above the standard width it is the fixed width
      const style: Record<string, string> = {};
      if (this.boxWidth > 0) {
        style.minWidth = `${this.boxWidth}px`;
      }
      if (this.boxWidth > GOODS_BOX_WIDTH) {
        style.width = `${this.boxWidth}px`;
        style.maxWidth = `${this.boxWidth}px`;
      }
      if (this.productionWidth > 0) {
        style['--players-table-production-width'] = `${this.productionWidth}px`;
      }
      return style;
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
