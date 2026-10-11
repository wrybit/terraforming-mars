<template>
  <PopupPanel @close="$emit('close')">
    <template #header>
      <h2 v-i18n>Keyboard Shortcuts</h2>
    </template>
    <span v-i18n>A - Main Board</span><br>
    <span v-i18n>S - Players Overview Table</span><br>
    <span v-i18n>D - Cards in Hand</span><br>
    <span v-i18n>F - Colonies</span><br>
    <template v-if="preferences().experimental_ui">
      <br>
      <span v-i18n>1-9 - Scroll through the player board.</span>
    </template>
    <br>
    <span v-i18n>? - Show this help</span><br>
    <span v-i18n>ESC - close this help</span><br>
    <br><span v-i18n>More coming.</span>
  </PopupPanel>
</template>
<script lang="ts">
import {defineComponent} from 'vue';
import PopupPanel from './common/PopupPanel.vue';
import {getPreferences} from '../utils/PreferencesManager';

export default defineComponent({
  name: 'KeyboardShortcuts',
  components: {
    PopupPanel,
  },
  computed: {
    preferences(): typeof getPreferences {
      return getPreferences;
    },
  },
});
</script>
