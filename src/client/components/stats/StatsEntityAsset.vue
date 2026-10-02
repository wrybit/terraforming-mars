<template>
  <button v-if="isCard" type="button" class="stats-asset stats-asset--card" :title="$t('Show card')" @click="showCard">
    <Card :card="{name: cardName}"/>
  </button>
  <div v-else-if="kind === 'milestone'" class="stats-asset stats-asset--tile">
    <div class="milestones"><Milestone :milestone="{name: milestoneName, playerName: undefined, color: undefined, scores: []}" :showScores="false" :showDescription="true"/></div>
  </div>
  <div v-else-if="kind === 'award'" class="stats-asset stats-asset--tile">
    <div class="awards"><Award :award="{name: awardName, playerName: undefined, color: undefined, scores: []}" :showScores="false" :showDescription="true"/></div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {MilestoneName} from '@/common/ma/MilestoneName';
import {AwardName} from '@/common/ma/AwardName';
import Card from '@/client/components/card/Card.vue';
import Milestone from '@/client/components/Milestone.vue';
import Award from '@/client/components/Award.vue';
import {StatsKind} from './statsKinds';
import {CARD_ZOOM_KEY, OpenCardZoom} from './statsCardZoom';

// Das Spielmaterial eines Eintrags, so wie es im Spiel aussieht: Karte, Meilenstein- oder Auszeichnungskachel.
// Karten öffnen beim Klick die Großansicht (durch "siblings" blätterbar).
export default defineComponent({
  name: 'StatsEntityAsset',
  components: {Card, Milestone, Award},
  inject: {
    openCardZoom: {from: CARD_ZOOM_KEY, default: () => () => {}},
  },
  props: {
    kind: {type: String as PropType<StatsKind>, required: true},
    name: {type: String, required: true},
    siblings: {type: Array as PropType<ReadonlyArray<string>>, required: false},
  },
  computed: {
    isCard(): boolean {
      return this.kind === 'card' || this.kind === 'prelude' || this.kind === 'corporation';
    },
    cardName(): CardName {
      return this.name as CardName;
    },
    milestoneName(): MilestoneName {
      return this.name as MilestoneName;
    },
    awardName(): AwardName {
      return this.name as AwardName;
    },
  },
  methods: {
    showCard(event: MouseEvent): void {
      const names = (this.siblings ?? [this.name]) as ReadonlyArray<CardName>;
      (this.openCardZoom as OpenCardZoom)({
        names,
        index: Math.max(0, names.indexOf(this.cardName)),
        origin: (event.currentTarget as HTMLElement).getBoundingClientRect(),
      });
    },
  },
});
</script>
