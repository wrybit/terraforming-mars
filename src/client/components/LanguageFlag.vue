<template>
  <img class="language-flag" :src="`assets/flags/${lang}.svg`" alt="" draggable="false">
</template>

<script setup lang="ts">
// Rechteckige Flagge (assets/flags/<sprache>.svg) – ersetzt die runden Sprite-Flaggen.
// Kein Kommentar im Template: ein einzelnes Wurzelelement, damit class/title vom Aufrufer ankommen.
import {LANGUAGE} from '@/common/constants';

defineProps<{
  lang: LANGUAGE;
}>();
</script>
