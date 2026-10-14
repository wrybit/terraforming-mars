<template>
  <button v-if="effect.tile !== undefined || effect.token !== undefined" type="button" :class="['log-effect', 'log-effect--tile']"
    :title="effect.token !== undefined ? tokenText : undefined" @click.stop="$emit('spaceClicked', effect.space)">
    <!-- A tile (or underground token) links to its space on the board, like the space chips of the text lines -->
    <i :class="['log-effect-icon', effect.tile !== undefined ? 'log-effect-tile--' + effect.tile : 'log-effect-token underground-token--' + effect.token]"></i>
    <!-- Board coordinate as in the classic log, so the place is readable without clicking -->
    <span v-if="spaceLabel !== undefined" class="log-effect-space">{{ spaceLabel }}</span>
  </button>
  <span v-else :title="effect.label !== undefined ? $t(effect.label) : undefined" :class="['log-effect', {'log-effect--production': effect.production, 'log-effect--loss': effect.amount < 0}]">
    <!-- Number, then symbol – the same for every resource, production on a brown area -->
    <b>{{ effect.amount < 0 ? '−' : '+' }}{{ Math.abs(effect.amount) }}</b>
    <i :class="['log-effect-icon', 'log-effect-resource--' + effect.resource]"></i>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {LogEffect} from '@/client/components/logpanel/logActions';
import {translateText} from '@/client/directives/i18n';
import {UndergroundResourceToken, undergroundResourceTokenDescription} from '@/common/underworld/UndergroundResourceToken';

export default defineComponent({
  name: 'LogEffectIcon',
  props: {
    effect: {
      type: Object as PropType<LogEffect>,
      required: true,
    },
    // Coordinate of the effect's space; omitted where no game is at hand (hover summary)
    spaceLabel: {
      type: String,
      required: false,
    },
  },
  emits: ['spaceClicked'],
  computed: {
    tokenText(): string {
      const token = this.effect.token as UndergroundResourceToken | undefined;
      return token === undefined ? '' : translateText(undergroundResourceTokenDescription[token] ?? token);
    },
  },
});
</script>
