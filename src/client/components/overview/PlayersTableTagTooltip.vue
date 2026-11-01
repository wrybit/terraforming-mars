<template>
  <!-- In body: the table's zoom and backdrop-filter would otherwise shift and clip a fixed element -->
  <Teleport to="body">
    <div ref="box" class="tag-sums-tooltip" role="tooltip" :style="{left: position.left + 'px', top: position.top + 'px'}" data-test="tag-sums-tooltip">
      <!-- Column: this tag across all players -->
      <div class="tag-sums-tooltip-group">
        <span class="tag-sums-tooltip-icon"><Tag :tag="(tag as CardTag)" size="big" type="secondary" /></span>
        <span class="tag-sums-tooltip-label tag-sums-tooltip-label--tag">{{ $t(tag) }}</span>
        <span class="tag-sums-tooltip-sum" data-test="column-total">{{ columnTotal }}</span>
        <span class="tag-sums-tooltip-note" v-i18n>All players</span>
      </div>
      <!-- Row: all tags of the hovered player, the acrylic cube shows the player color -->
      <div class="tag-sums-tooltip-group">
        <span class="tag-sums-tooltip-icon"><PlayerCube :color="color" view="iso" :size="13" /></span>
        <span class="tag-sums-tooltip-label">{{ playerName }}</span>
        <span class="tag-sums-tooltip-sum" data-test="player-total">{{ playerTotal }}</span>
        <span class="tag-sums-tooltip-note" v-i18n>All tags except City and No tag</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import Tag from '@/client/components/Tag.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {Tag as CardTag} from '@/common/cards/Tag';
import {Color} from '@/common/Color';
import {InterfaceTagsType} from '@/client/components/overview/playerTagDetails';
import {tagTooltipPosition} from '@/client/components/overview/playersTableTagSums';

const props = defineProps<{
  tag: InterfaceTagsType;
  color: Color;
  playerName: string;
  columnTotal: number;
  playerTotal: number;
  // Mouse position in window coordinates
  pointerX: number;
  pointerY: number;
}>();

const box = ref<HTMLElement>();
const position = ref({left: 0, top: 0});

// Measured after rendering: the size depends on the name and the language
function place(): void {
  const element = box.value;
  if (element === undefined) {
    return;
  }
  position.value = tagTooltipPosition(
    {x: props.pointerX, y: props.pointerY},
    {width: element.offsetWidth, height: element.offsetHeight},
    {width: document.documentElement.clientWidth, height: window.innerHeight});
}

onMounted(place);
watch(() => [props.pointerX, props.pointerY, props.tag, props.color], place, {flush: 'post'});
</script>
