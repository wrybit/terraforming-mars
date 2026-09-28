<template>
  <div class="sidebar_item sidebar_item--language" :title="$t('Language')">
    <div
      class="sidebar_icon sidebar_icon--language"
      :class="{'sidebar_item--is-active': languagePanelOpen}">
      <div :class="`language-icon language-icon-for-sidebar language-icon--${lang}`"
      :title="title"
      @click="languagePanelOpen = !languagePanelOpen"></div>
      </div>
    <SidebarModal :open="languagePanelOpen" @close="languagePanelOpen = false">
      <LanguageSelectionDialog :preferencesManager="PreferencesManager.INSTANCE"/>
    </SidebarModal>
  </div>
</template>

<script setup lang="ts">

import {computed, ref} from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import LanguageSelectionDialog from '@/client/components/LanguageSelectionDialog.vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import {LANGUAGES} from '@/common/constants';

// Geschlossen wird über SidebarModal (✕, Escape, Klick daneben)
const languagePanelOpen = ref(false);
const lang = computed(() => PreferencesManager.INSTANCE.values().lang as keyof typeof LANGUAGES);
const title = computed(() => {
  const language = LANGUAGES[lang.value];
  return `${language[0]} (${language[1]})`;
});
</script>
