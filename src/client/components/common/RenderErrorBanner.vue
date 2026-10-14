<template>
  <!-- After a display error the page may no longer react: a reload brings it back (renderErrors.ts) -->
  <div v-if="renderErrorOccurred" class="render-error-banner" role="alert" data-test="render-error-banner">
    <span v-i18n>The page ran into a display error.</span>
    <button type="button" class="btn btn-submit btn-rounded render-error-banner__reload" @click="reload" v-i18n>Reload</button>
  </div>
</template>

<script setup lang="ts">
import {renderErrorOccurred} from '@/client/utils/renderErrors';

function reload(): void {
  window.location.reload();
}
</script>
