<template>
  <div class="create-game-card-grid">
    <div v-for="name in names" :key="name" :class="['cardbox', 'create-game-card-grid-item', tone && `create-game-card-grid-item--${tone}`]">
      <Card :card="{name}"/>
      <AppButton v-if="removable" class="create-game-card-grid-remove" size="small" type="close" :title="$t('Remove')" @click="$emit('remove', name)"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';

// Cards of the "Create game" form shown as real cards (excluded/included cards, changes of the custom lists),
// so you can see at a glance what you picked instead of only reading names
export default defineComponent({
  name: 'CardPreviewGrid',
  components: {Card, AppButton},
  emits: ['remove'],
  props: {
    names: {type: Array as PropType<ReadonlyArray<CardName>>, required: true},
    // Close button on every card
    removable: {type: Boolean, default: false},
    // Marks the cards as removed from (dimmed) or added to the default pool
    tone: {type: String as PropType<'added' | 'removed' | undefined>, required: false},
  },
});
</script>
