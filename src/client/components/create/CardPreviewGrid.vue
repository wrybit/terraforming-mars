<template>
  <div :class="['create-game-card-grid', {'create-game-card-grid--row': row}]">
    <div v-for="name in names" :key="name"
      :class="['cardbox', 'create-game-card-grid-item', tone && `create-game-card-grid-item--${tone}`,
        {'create-game-card-grid-item--selectable': selectable, 'create-game-card-grid-item--active': name === activeName}]"
      @mouseenter="selectable && $emit('hover', name)" @click="selectable && $emit('select', name)">
      <Card :card="{name}"/>
      <AppButton v-if="removable" class="create-game-card-grid-remove" size="small" type="close" @click="$emit('remove', name)"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {CardName} from '@/common/cards/CardName';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';

// Cards of the "Create game" form shown as real cards (search matches, excluded/included cards,
// changes of the custom lists), so you can see at a glance what you pick instead of only reading names
export default defineComponent({
  name: 'CardPreviewGrid',
  components: {Card, AppButton},
  emits: ['remove', 'select', 'hover'],
  props: {
    names: {type: Array as PropType<ReadonlyArray<CardName>>, required: true},
    // Close button on every card
    removable: {type: Boolean, default: false},
    // Cards can be picked by a click (search matches)
    selectable: {type: Boolean, default: false},
    // Highlighted card (keyboard focus of the search)
    activeName: {type: String as PropType<CardName | undefined>, required: false},
    // One horizontal row that scrolls instead of wrapping
    row: {type: Boolean, default: false},
    // Marks the cards as removed from (dimmed) or added to the default pool
    tone: {type: String as PropType<'added' | 'removed' | undefined>, required: false},
  },
  watch: {
    // Keyboard highlight moved out of the visible part of the row: scroll it in
    activeName() {
      this.$nextTick(() => {
        (this.$el as HTMLElement).querySelector('.create-game-card-grid-item--active')?.scrollIntoView?.({block: 'nearest', inline: 'nearest'});
      });
    },
  },
});
</script>
