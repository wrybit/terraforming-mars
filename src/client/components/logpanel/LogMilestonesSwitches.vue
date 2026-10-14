<template>
  <div :class="['log-milestones-toggles', {'log-milestones-toggles--corner': corner}]">
    <!-- Switches of the milestones & awards box (LogPanel.vue): whether the box opens by itself on one's own turn
         (only while it is a tab of the log box) and whether it gets its own box above the log.
         Bound to the preference, not constants: a hidden tab keeps its checkboxes, a constant would never reset them -->
    <ToggleSwitch v-if="!separateOnly" data-test="log-milestones-auto"
      :modelValue="autoOpen" :label="$t('Open on my turn')" @update:modelValue="$emit('autoOpen', $event)"/>
    <ToggleSwitch data-test="log-milestones-separate"
      :modelValue="separate" :label="$t('Separate log')" @update:modelValue="$emit('separate', $event)"/>
  </div>
</template>

<script setup lang="ts">
import ToggleSwitch from '@/client/components/common/ToggleSwitch.vue';

defineProps<{
  autoOpen?: boolean;
  // Separate box: no "open on my turn" switch, the table is always visible anyway
  separateOnly?: boolean;
  separate: boolean;
  // In the free corner above the names: stacked, switch in front of the label
  corner?: boolean;
}>();

defineEmits<{
  autoOpen: [on: boolean];
  separate: [on: boolean];
}>();
</script>
