<template>
  <span class="ma-table-icon">
    <!-- Two plain images: one half each in one icon, so it stays as large as the others -->
    <span v-if="split" class="ma-table-icon-split" data-test="split">
      <img v-for="(part, index) in parts" :key="index" :src="imagePath(part)" alt="">
    </span>
    <template v-else v-for="(part, index) in parts" :key="index">
      <span v-if="part.production" class="ma-table-icon-production"><img :src="imagePath(part)" alt=""></span>
      <img v-else :src="imagePath(part)" :class="{'ma-table-icon-outline': part.outline}" alt="">
    </template>
    <!-- Milestone requirement (threshold) centered on the icon -->
    <span v-if="requirement !== undefined" class="ma-table-icon-requirement" :style="{left: `${centerX}%`}" data-test="requirement">{{ requirement }}</span>
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {IconPart} from '@/client/components/milestoneAwardTable/milestoneAwardIcons';

export default defineComponent({
  name: 'MilestoneAwardIcon',
  props: {
    parts: {
      type: Array as () => ReadonlyArray<IconPart>,
      required: true,
    },
    requirement: {
      type: Number,
      default: undefined,
    },
  },
  computed: {
    split(): boolean {
      return this.parts.length === 2 && this.parts.every((part) => !part.production);
    },
    centerX(): number {
      return this.parts[0]?.centerX ?? 50;
    },
  },
  methods: {
    imagePath(part: IconPart): string {
      return `assets/${part.asset}.png`;
    },
  },
});
</script>
