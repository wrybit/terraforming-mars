<template>
  <!-- The whole tile is clickable, not just the small flag inside (like help/settings).
       Clicks inside the modal don't reach the tile: SidebarModal is teleported to body -->
  <div class="sidebar_item sidebar_item--language" :title="$t('Language')" @click="languagePanelOpen = true">
    <div
      class="sidebar_icon sidebar_icon--language"
      :class="{'sidebar_item--is-active': languagePanelOpen}">
      <LanguageFlag :lang="lang" class="language-flag--toolbar" :title="title"/>
    </div>
    <SidebarModal :open="languagePanelOpen" :framed="true" @close="languagePanelOpen = false">
      <LanguageSelectionDialog :preferencesManager="PreferencesManager.INSTANCE" @close="languagePanelOpen = false"/>
    </SidebarModal>
  </div>
</template>

<script setup lang="ts">

import {computed, ref} from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import LanguageFlag from '@/client/components/LanguageFlag.vue';
import LanguageSelectionDialog from '@/client/components/LanguageSelectionDialog.vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import {LANGUAGE, LANGUAGES} from '@/common/constants';

// Closed via SidebarModal (Escape, click outside) or the ✕ in the dialog header
const languagePanelOpen = ref(false);
const lang = computed(() => PreferencesManager.INSTANCE.values().lang as LANGUAGE);
const title = computed(() => {
  const language = LANGUAGES[lang.value];
  return `${language[0]} (${language[1]})`;
});
</script>
