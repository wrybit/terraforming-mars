<template>
  <a :href="href" class="tooltip create-game-info" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank" @click.stop>&#9432;</a>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Verweis ins Wiki; click.stop, damit ein Klick darauf nicht die umgebende Kachel/Option umschaltet
export default defineComponent({
  name: 'InfoLink',
  props: {
    href: {
      type: String,
      required: true,
    },
  },
});
</script>
