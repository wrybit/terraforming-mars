<template>
  <!-- Cancel the current action and return to the action menu, as long as it is only a plan
       (nothing hidden revealed, no other player affected – server actionStart.ts). Left in the footer -->
  <AppButton v-if="cancelAction !== undefined && cancelAction.available()" class="cancel-action-button" :title="$t('Cancel')" @click="cancelAction.cancel()"/>
</template>

<script setup lang="ts">
import {inject} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {CANCEL_ACTION} from '@/client/components/cancelAction';

const cancelAction = inject(CANCEL_ACTION, undefined);
</script>
