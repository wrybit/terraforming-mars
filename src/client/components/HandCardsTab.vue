<template>
  <!-- Cards tab (view only, gray): hand cards in the action menu (OrOptions) and in the hand cards block (PlayerHome),
       in the setup phase with a different label for the own initial selection (PlayerSetupView) -->
  <button type="button" role="tab"
    :title="$t(label)"
    :aria-selected="active"
    data-hotkey="tab-hand"
    :class="['or-tab', 'or-tab--view', 'or-tab--hand', {'or-tab--active': active, 'or-tab--empty': count === 0}]"
    @click="$emit('select')">
    <span class="or-tab-title">{{ $t(label) }}</span>
    <HotkeyKeys action="tab-hand"/>
    <span class="or-tab-count">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
withDefaults(defineProps<{
  count: number;
  active: boolean;
  label?: string;
}>(), {
  label: 'All cards',
});

defineEmits<{
  (event: 'select'): void;
}>();
</script>
