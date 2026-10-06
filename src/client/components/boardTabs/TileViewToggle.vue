<template>
  <!-- Tiles / bonus / coordinates as a segmented switch at the bottom of the Mars and Moon box -->
  <div class="tile-view-toggle" role="radiogroup" data-test="tile-view-toggle">
    <button v-for="option in OPTIONS" :key="option.view" type="button" role="radio"
      :class="['tile-view-toggle__option', {'tile-view-toggle__option--on': option.view === tileView}]"
      :aria-checked="option.view === tileView"
      @click="choose(option.view)">{{ $t(option.label) }}</button>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {TileView, nextTileView} from '@/client/components/board/TileView';

const OPTIONS: ReadonlyArray<{view: TileView, label: string}> = [
  {view: 'show', label: 'Board tiles'},
  {view: 'hide', label: 'Space bonus'},
  {view: 'coords', label: 'Coordinates'},
];

export default defineComponent({
  name: 'TileViewToggle',
  props: {
    tileView: {
      type: String as PropType<TileView>,
      required: true,
    },
  },
  // The homes only know "next view" (cycleTileView): step forward until the chosen view is reached
  emits: ['toggleTileView'],
  computed: {
    OPTIONS(): typeof OPTIONS {
      return OPTIONS;
    },
  },
  methods: {
    choose(view: TileView) {
      let current = this.tileView;
      for (let step = 0; step < OPTIONS.length && current !== view; step++) {
        this.$emit('toggleTileView');
        current = nextTileView(current);
      }
    },
  },
});
</script>
