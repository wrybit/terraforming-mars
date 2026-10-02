<template>
  <!-- In a tab box the content (confirm buttons, payment area) moves into its sticky footer
       (tabPanelFooter.ts, tab_panel_footer.less); outside one it stays in place -->
  <Teleport :to="target" :disabled="target === undefined" defer>
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import {inject} from 'vue';
import {TAB_PANEL_FOOTER} from '@/client/components/tabPanelFooter';

const target = inject(TAB_PANEL_FOOTER, undefined);
</script>
