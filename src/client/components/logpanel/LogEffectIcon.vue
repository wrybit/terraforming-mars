<template>
  <button v-if="effect.tile !== undefined" type="button" :class="['log-effect', 'log-effect--tile']" @click.stop="$emit('spaceClicked', effect.space)">
    <!-- A tile links to its space on the board, like the space chips of the text lines -->
    <i :class="['log-effect-icon', 'log-effect-tile--' + effect.tile]"></i>
  </button>
  <span v-else :class="['log-effect', {'log-effect--production': effect.production, 'log-effect--loss': effect.amount < 0}]">
    <!-- Number, then symbol – the same for every resource, production on a brown area -->
    <b>{{ effect.amount < 0 ? '−' : '+' }}{{ Math.abs(effect.amount) }}</b>
    <i :class="['log-effect-icon', 'log-effect-resource--' + effect.resource]"></i>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {LogEffect} from '@/client/components/logpanel/logActions';

export default defineComponent({
  name: 'LogEffectIcon',
  props: {
    effect: {
      type: Object as PropType<LogEffect>,
      required: true,
    },
  },
  emits: ['spaceClicked'],
});
</script>
