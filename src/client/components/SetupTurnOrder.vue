<template>
  <!-- Zugreihenfolge in der Startphase (statt der Spielerleisten, die dort nur Nullen zeigen):
       nummerierte Namen in Spielerfarbe, der Startspieler steht vorne -->
  <div class="setup-turn-order">
    <h2 class="setup-turn-order-title" v-i18n>Turn order</h2>
    <ol class="setup-turn-order-list">
      <li v-for="(player, index) in players" :key="player.color"
        :class="['setup-turn-order-player', playerColorClass(player.color, 'bg'), {'setup-turn-order-player--first': index === 0}]">
        <span class="setup-turn-order-number">{{ index + 1 }}.</span>
        <span>{{ player.name }}</span>
      </li>
    </ol>
    <!-- Platz für Bedienelemente rechts oben in der Box (z. B. Spielplan einklappen, PlayerHome.vue) -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {playerColorClass} from '@/common/utils/utils';

defineProps<{
  // In Zugreihenfolge (Startspieler zuerst), wie vom Server geliefert
  players: ReadonlyArray<PublicPlayerModel>;
}>();
</script>
