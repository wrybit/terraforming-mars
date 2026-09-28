<template>
  <!-- Handkarten-Tab (nur Ansicht, grau): im Aktionsmenü (OrOptions) und allein im Handkarten-Block (PlayerHome) -->
  <button type="button" role="tab"
    :title="$t('Cards In Hand')"
    :aria-selected="active"
    :class="['or-tab', 'or-tab--hand', {'or-tab--active': active, 'or-tab--empty': count === 0}]"
    @click="$emit('select')">
    <span class="or-tab-title">{{ $t('Cards In Hand') }}</span>
    <span class="or-tab-count">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  count: number;
  active: boolean;
}>();

defineEmits<{
  (event: 'select'): void;
}>();
</script>
