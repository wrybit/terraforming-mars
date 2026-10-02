<template>
  <!-- Sprache und Einstellungen oben rechts als Milchglas-Buttons, wie im Spiel (sidebar_toolbar.less);
       gemeinsam für alle Seiten außerhalb des Spiels, damit die Ecke überall gleich aussieht -->
  <div class="page-toolbar">
    <LanguageIcon/>
    <PreferencesIcon/>
  </div>
</template>

<script setup lang="ts">
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
</script>
