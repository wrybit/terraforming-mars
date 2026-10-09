<template>
  <!-- Legal notice (fan_project_notice.less), one text for every place it appears: game menu, page footer, game info -->
  <span :class="['fan-project-notice', `fan-project-notice--${layout}`]" data-test="fan-project-notice">
    <strong class="fan-project-notice-title" v-i18n>Unofficial fan project</strong>
    <span class="fan-project-notice-text" v-i18n>Not affiliated with FryxGames, Asmodee Digital or Steam in any way.</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  // stacked: title above the text (menu box); inline: one line with a separator (footers)
  layout?: 'stacked' | 'inline';
}>(), {
  layout: 'inline',
});
</script>
