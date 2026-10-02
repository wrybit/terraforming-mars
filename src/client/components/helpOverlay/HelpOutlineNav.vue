<template>
  <!-- Seitenbaum des Hilfe-Overlays; ruft sich für Unterebenen selbst auf.
       Am Handy macht help_overlay.less daraus eine waagerechte Chip-Leiste. -->
  <ul class="help-outline-list" :class="{'help-outline-list--nested': nested}">
    <li v-for="node in nodes" :key="node.id">
      <a
        :href="'#' + node.id"
        class="help-outline-link"
        :class="{'help-outline-link--active': node.id === activeId}"
        :data-outline-id="node.id"
        @click.prevent="emit('select', node.id)"
      >{{ node.label }}</a>
      <HelpOutlineNav
        v-if="node.children.length > 0"
        :nodes="node.children"
        :active-id="activeId"
        :nested="true"
        @select="(id: string) => emit('select', id)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import {HelpOutlineNode} from '@/client/components/helpOverlay/helpOutline';

defineProps<{
  nodes: ReadonlyArray<HelpOutlineNode>;
  activeId: string | undefined;
  nested?: boolean;
}>();

const emit = defineEmits<{
  (event: 'select', id: string): void;
}>();
</script>
