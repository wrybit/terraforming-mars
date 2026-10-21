<template>
  <span :class="['players-table-score-icon', 'players-table-score-icon--' + kind, 'tooltip', 'tooltip-bottom']" :data-tooltip="$t(label)"></span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Icon of a score column: victory points, terraform rating, cards in hand, actions on active cards.
// Same pictures as the classic bar (players_table.less), so a theme that swaps the pictures swaps these too
export type ScoreKind = 'vp' | 'tr' | 'hand' | 'actions';

const LABELS: Record<ScoreKind, string> = {
  vp: 'Victory Points',
  tr: 'Terraform Rating',
  hand: 'Cards in hand',
  actions: 'The number of available actions on active cards',
};

export default defineComponent({
  name: 'ScoreIcon',
  props: {
    kind: {
      type: String as () => ScoreKind,
      required: true,
    },
  },
  computed: {
    label(): string {
      return LABELS[this.kind];
    },
  },
});
</script>
