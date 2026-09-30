<template>
  <div class="players-table-cell">
    <!-- Warenbox: Vorrat groß (darauf schaut man), Produktion als zweiter Wert, Wert je Einheit als Münze an der Ecke -->
    <div :class="boxClasses">
      <!-- Schild vor dem Vorrat: Geschütztes steht als weiße Fläche mit schwarzer Zahl heraus -->
      <span class="players-table-goods-stock" data-test="stock"><span v-if="protectionIcon !== ''" :class="['players-table-protection', protectionIcon]" data-test="protection"></span>{{ good.count }}</span>
      <span :class="productionClasses" data-test="production" :data-tooltip="$t('Production count')">{{ productionText }}</span>
      <span v-if="showValue" class="players-table-goods-value" data-test="value">{{ good.value }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerGood, shouldShowResourceValue} from '@/client/components/overview/playerGoods';

export default defineComponent({
  name: 'PlayersTableGoods',
  props: {
    good: {
      type: Object as () => PlayerGood,
      required: true,
    },
    // Alleinige höchste Produktion am Tisch – wird hervorgehoben
    isProductionLeader: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
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
    // Schutz (z. B. durch Karten gegen Angriffe) als kleines Schild, wie in der klassischen Leiste
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
