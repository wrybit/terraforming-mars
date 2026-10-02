<template>
  <DialogFrame :title="$t('Language')" :width="640" class="language-selection" @close="emit('close')">
    <template #icon>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>
    </template>
    <div class="language-selection-grid">
      <!-- Name in der eigenen Sprache groß, englischer Name zur Orientierung klein darunter -->
      <button
        v-for="lang in ALL_LANGUAGES"
        :key="lang"
        type="button"
        class="language-selection-tile"
        :class="{'is-selected': lang === currentLanguage}"
        :title="LANGUAGES[lang][1]"
        @click="switchLanguageTo(lang)">
        <LanguageFlag :lang="lang"/>
        <span class="language-selection-text">
          <span class="language-selection-native">{{ LANGUAGES[lang][0] }}</span>
          <span class="language-selection-english">{{ LANGUAGES[lang][1] }}</span>
        </span>
      </button>
    </div>
  </DialogFrame>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {ALL_LANGUAGES, LANGUAGE, LANGUAGES} from '@/common/constants';
import DialogFrame from '@/client/components/DialogFrame.vue';
import LanguageFlag from '@/client/components/LanguageFlag.vue';

const props = defineProps<{
  preferencesManager: PreferencesManager;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

const currentLanguage = computed(() => props.preferencesManager.values().lang);

function switchLanguageTo(lang: LANGUAGE) {
  props.preferencesManager.set('lang', lang);
  window.location.reload();
}
</script>
