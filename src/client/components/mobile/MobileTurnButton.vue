<template>
  <span :class="['mb-turn-button', {'mb-turn-button--idle': !acting}]">
    <!-- Runder Zug-Button mit Rakete: in der Fußleiste und auf der Kante des Zug-Sheets (dort fährt er mit hoch).
         Am Zug lila mit Puls und Badge „Aktion x/y“, sonst grau ohne Badge. Kommentar innen, damit die Wurzel ein Element bleibt (Klassen-Durchreichung) -->
    <MobileNavIcon name="rocket" :stroke-width="2"/>
    <span v-if="actionNumber !== undefined" class="mb-turn-count">{{ actionNumber }}/{{ actionsPerTurn }}</span>
  </span>
</template>

<script setup lang="ts">
import MobileNavIcon from '@/client/components/mobile/MobileNavIcon.vue';

defineProps<{
  acting: boolean;
  actionNumber: number | undefined;
  actionsPerTurn: number;
}>();
</script>
