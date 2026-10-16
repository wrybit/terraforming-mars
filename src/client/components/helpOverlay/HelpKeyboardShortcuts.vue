<template>
  <!-- Keyboard shortcuts in the help: the same list as the shortcut dialog ('?'), with the player's own keys.
       Changing them happens in that dialog. -->
  <div class="help-shortcuts">
    <section class="help-overlay-section">
      <h2 class="help-overlay-section-title" v-i18n>Keyboard Shortcuts</h2>
      <p class="help-overlay-section-lead" v-i18n>Press ? in the game to see these keys and change them.</p>
      <HotkeyList/>
    </section>
  </div>
</template>

<script setup lang="ts">
import HotkeyList from '@/client/components/hotkeys/HotkeyList.vue';
</script>
