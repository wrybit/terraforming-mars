<template>
  <!-- In einer Tab-Box wandert der Inhalt (Bestätigen-Buttons, Bezahlbereich) in deren klebenden Fußbereich
       (tabPanelFooter.ts, tab_panel_footer.less); außerhalb bleibt er an Ort und Stelle -->
  <Teleport :to="target" :disabled="target === undefined" defer>
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import {inject} from 'vue';
import {TAB_PANEL_FOOTER} from '@/client/components/tabPanelFooter';

const target = inject(TAB_PANEL_FOOTER, undefined);
</script>
