<template>
  <!-- Mars or Dune at a glance: the planet of the game's theme with its name on it, like the Mars/Dune switch.
       Shared by the admin games overview and the lobby list -->
  <span class="theme-planet-badge" :class="'theme-planet-badge--' + planet.theme" :style="{backgroundImage: `url(${planet.planet})`}"
    data-test="game-theme">{{ planet.label }}</span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {DEFAULT_THEME, Theme} from '@/common/theme/Theme';
import {THEME_PLANETS} from '@/client/theme/themePlanets';

const props = defineProps<{
  // Theme of the game; games saved without one are Mars
  theme: Theme | undefined;
}>();

const planet = computed(() => THEME_PLANETS[props.theme ?? DEFAULT_THEME]);
</script>
