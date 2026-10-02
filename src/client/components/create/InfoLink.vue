<template>
  <a :href="href" class="tooltip create-game-info" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank" @click.stop>&#9432;</a>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

// Link into the wiki; click.stop so a click on it doesn't toggle the surrounding tile/option
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
