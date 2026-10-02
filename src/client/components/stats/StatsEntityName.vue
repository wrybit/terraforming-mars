<template>
  <a v-if="kind === 'player'" :href="href" data-stats-link class="stats-player" :class="`player_translucent_bg_color_${color}`">{{ name }}</a>
  <span v-else class="stats-entity-group">
    <a :href="href" data-stats-link class="stats-entity">
      <MilestoneAwardIcon v-if="iconParts !== undefined" class="stats-entity-icon" :parts="iconParts"/>
      <span v-i18n>{{ label }}</span>
    </a>
    <!-- Karten lassen sich groß ansehen; das Symbol ist eine kleine Karte -->
    <button v-if="isCard" type="button" class="stats-card-button" :title="$t('Show card')" :aria-label="$t('Show card')" @click="showCard"></button>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {MilestoneName} from '@/common/ma/MilestoneName';
import {AwardName} from '@/common/ma/AwardName';
import {AWARD_ICONS, IconPart, MILESTONE_ICONS} from '@/client/components/milestoneAwardTable/milestoneAwardIcons';
import MilestoneAwardIcon from '@/client/components/milestoneAwardTable/MilestoneAwardIcon.vue';
import {StatsKind} from './statsKinds';
import {statsHref} from './statsNavigation';
import {boardLabel} from './statsLabels';
import {CardName} from '@/common/cards/CardName';
import {CARD_ZOOM_KEY, OpenCardZoom} from './statsCardZoom';

// Arten, deren Einträge Karten sind
const CARD_KINDS: ReadonlyArray<StatsKind> = ['corporation', 'prelude', 'card'];

// Name eines Eintrags als Link zur Detailseite; Spieler in ihrer Spielerfarbe, Meilensteine/Auszeichnungen mit Symbol
export default defineComponent({
  name: 'StatsEntityName',
  components: {MilestoneAwardIcon},
  inject: {
    playerColors: {default: () => new Map<string, Color>()},
    openCardZoom: {from: CARD_ZOOM_KEY, default: () => () => {}},
  },
  props: {
    kind: {type: String as PropType<StatsKind>, required: true},
    name: {type: String, required: true},
    // Karten in Anzeigereihenfolge, durch die die Großansicht blättert (ohne Angabe nur diese Karte)
    siblings: {type: Array as PropType<ReadonlyArray<string>>, required: false},
  },
  computed: {
    href(): string {
      return statsHref({type: 'detail', kind: this.kind, name: this.name});
    },
    label(): string {
      return this.kind === 'board' ? boardLabel(this.name) : this.name;
    },
    color(): Color {
      return (this.playerColors as Map<string, Color>).get(this.name) ?? 'neutral';
    },
    isCard(): boolean {
      return CARD_KINDS.includes(this.kind);
    },
    iconParts(): ReadonlyArray<IconPart> | undefined {
      if (this.kind === 'milestone') {
        return MILESTONE_ICONS[this.name as MilestoneName];
      }
      if (this.kind === 'award') {
        return AWARD_ICONS[this.name as AwardName];
      }
      return undefined;
    },
  },
  methods: {
    showCard(event: MouseEvent): void {
      const names = (this.siblings ?? [this.name]) as ReadonlyArray<CardName>;
      (this.openCardZoom as OpenCardZoom)({
        names,
        index: Math.max(0, names.indexOf(this.name as CardName)),
        origin: (event.currentTarget as HTMLElement).getBoundingClientRect(),
      });
    },
  },
});
</script>
