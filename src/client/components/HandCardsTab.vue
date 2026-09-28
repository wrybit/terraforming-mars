<template>
  <!-- Karten-Tab (nur Ansicht, grau): Handkarten im Aktionsmenü (OrOptions) und im Handkarten-Block (PlayerHome),
       in der Startphase mit anderem Label für die eigene Startauswahl (PlayerSetupView) -->
  <button type="button" role="tab"
    :title="$t(label)"
    :aria-selected="active"
    :class="['or-tab', 'or-tab--view', 'or-tab--hand', {'or-tab--active': active, 'or-tab--empty': count === 0}]"
    @click="$emit('select')">
    <span class="or-tab-title">{{ $t(label) }}</span>
    <span class="or-tab-count">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  count: number;
  active: boolean;
  label?: string;
}>(), {
  label: 'Cards In Hand',
});

defineEmits<{
  (event: 'select'): void;
}>();
</script>
