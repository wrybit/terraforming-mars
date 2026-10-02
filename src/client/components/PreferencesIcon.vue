<template>
  <div class="sidebar_item sidebar_item--settings">
    <i class="sidebar_icon sidebar_icon--settings" :title="$t('Player Settings')" :class="{'sidebar_item--is-active': preferencesPanelOpen}" @click="preferencesPanelOpen = !preferencesPanelOpen"></i>
    <SidebarModal :open="preferencesPanelOpen" :framed="true" @close="preferencesPanelOpen = false">
      <PreferencesDialog @okButtonClicked="preferencesPanelOpen = false" :preferencesManager="PreferencesManager.INSTANCE"/>
    </SidebarModal>
  </div>
</template>

<script setup lang="ts">

import {ref} from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import PreferencesDialog from '@/client/components/PreferencesDialog.vue';
import SidebarModal from '@/client/components/SidebarModal.vue';

// Geschlossen wird über SidebarModal (Escape, Klick daneben), das ✕ im Dialogkopf oder den OK-Button
const preferencesPanelOpen = ref(false);

</script>
