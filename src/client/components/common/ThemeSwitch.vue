<template>
  <!-- Mars/Dune switch, the same on every page that has it (create game, statistics, card list): one bar, the planet of
       the chosen theme fills its half up to the middle (Mars left, Arrakis right), the chosen name black on it -->
  <div class="theme-switch" role="radiogroup" :aria-label="$t('Theme')" data-test="theme-switch">
    <!-- One planet: it rolls to the chosen side and turns from Mars into Arrakis (or back) on the way -->
    <span :class="['theme-switch__planet', 'theme-switch__planet--' + theme]" aria-hidden="true">
      <span v-for="option in OPTIONS" :key="option.theme"
        :class="['theme-switch__surface', 'theme-switch__surface--' + option.theme, {'theme-switch__surface--shown': option.theme === theme}]"
        :style="{backgroundImage: `url(${option.planet})`}"></span>
    </span>
    <button v-for="option in OPTIONS" :key="option.theme" type="button" role="radio"
      :class="['theme-switch__option', 'theme-switch__option--' + option.theme, {'theme-switch__option--selected': option.theme === theme}]"
      :aria-checked="option.theme === theme" @click="pick(option.theme)">{{ option.label }}</button>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import {Theme} from '@/common/theme/Theme';
import {activeTheme} from '@/client/theme/applyTheme';
import {chooseTheme} from '@/client/theme/themeChoice';
import {prefersReducedMotion} from '@/client/utils/motion';
import {THEME_PLANETS, ThemePlanet} from '@/client/theme/themePlanets';

// Mars left, Dune right (themePlanets.ts: names and pictures)
const OPTIONS: ReadonlyArray<ThemePlanet> = [THEME_PLANETS.mars, THEME_PLANETS.dune];

// Length of the planet roll (theme_switch.less @theme-switch-motion): the page is rendered anew in the other theme
// only afterwards, otherwise the new page would cut the roll off
const ROLL_MS = 800;

const emit = defineEmits<{
  // Right before the theme changes: the page can adjust what belongs to the old theme (e.g. card list filters)
  (event: 'switch', theme: Theme): void;
}>();

// Theme the bar shows: the one in effect, or already the picked one while its planet rolls in
const theme = ref<Theme>(activeTheme());
watch(activeTheme, (value) => theme.value = value);

async function pick(value: Theme): Promise<void> {
  if (value === theme.value) {
    return;
  }
  theme.value = value;
  if (!prefersReducedMotion()) {
    await new Promise((resolve) => setTimeout(resolve, ROLL_MS));
  }
  emit('switch', value);
  await chooseTheme(value);
}
</script>
