<template>
  <div class="column-resize-handle"
    v-proximity-handle
    role="separator" aria-orientation="vertical" tabindex="0"
    :aria-valuenow="share" :aria-valuemin="split.minShare" :aria-valuemax="split.maxShare"
    :aria-label="$t('Column width')" :title="$t('Column width')"
    @pointerdown="startResize" @dblclick="resetResize"
    @keydown.left.prevent="nudgeResize(1)" @keydown.right.prevent="nudgeResize(-1)">
    <!-- Vertical drag handle between the two columns of a page (game view, results page): sets the width of the right
         column on the parent grid (columnResize.ts). Invisible until the mouse approaches (handleProximity.ts);
         double click = default. Left / right split only visible while dragging or with keyboard focus -->
    <span class="column-resize-handle__label" aria-hidden="true">{{ splitLabel }}</span>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {vProximityHandle} from '@/client/directives/ProximityHandle';
import {ColumnSplit, KEYBOARD_STEP, applyShare, loadShare, setShare, shareLabel, startColumnResize} from '@/client/utils/columnResize';

export default defineComponent({
  name: 'ColumnResizeHandle',
  directives: {
    proximityHandle: vProximityHandle,
  },
  props: {
    split: {
      type: Object as PropType<ColumnSplit>,
      required: true,
    },
  },
  data() {
    return {
      // Share of the right column in percent
      share: loadShare(this.split),
    };
  },
  computed: {
    splitLabel(): string {
      return shareLabel(this.share);
    },
  },
  mounted() {
    // Apply the saved split immediately
    const container = this.container();
    if (container !== undefined) {
      applyShare(container, this.split, this.share);
    }
  },
  methods: {
    // The column grid is the parent of the handle
    container(): HTMLElement | undefined {
      return (this.$el as HTMLElement).parentElement ?? undefined;
    },
    startResize(event: PointerEvent) {
      const container = this.container();
      if (container !== undefined) {
        startColumnResize(event, container, this.split, (share) => {
          this.share = share;
        });
      }
    },
    resetResize() {
      this.setTo(this.split.defaultShare);
    },
    // Left arrow key moves the handle left, the right column gets wider
    nudgeResize(direction: number) {
      this.setTo(this.share + direction * KEYBOARD_STEP);
    },
    setTo(share: number) {
      const container = this.container();
      if (container !== undefined) {
        this.share = setShare(container, this.split, share);
      }
    },
  },
});
</script>
