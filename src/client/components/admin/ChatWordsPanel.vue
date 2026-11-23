<template>
  <!-- Words the lobby chat masks (server/lobby/chatWords.ts): one column per app language, one word per line; a save
       applies at once, no restart. Content of the "Chat filter" tab, which names it. On wide screens the columns
       fill the window down to its bottom edge, so the lists are seen without scrolling the page -->
  <section ref="root" class="chat-words" :style="height === undefined ? undefined : {height: height + 'px'}">
    <p class="server-settings-description" v-i18n>One word per line. A word is also masked at the start of longer words ("arsch" also in "Arschloch", not in "Barsch"). Links to other websites are always blocked.</p>
    <p class="server-settings-description" v-i18n>Every list applies to every message, players write in mixed languages.</p>
    <p v-if="status === 'loading'" class="games-overview-note" v-i18n>Loading…</p>
    <template v-else>
      <div ref="grid" class="chat-words-columns" :style="{'--chat-words-columns': columnsPerRow}">
        <label v-for="language in languages" :key="language" class="chat-words-column">
          <span class="chat-words-head" :title="`${LANGUAGES[language][0]} (${LANGUAGES[language][1]})`">
            <LanguageFlag :lang="language" class="chat-words-flag" />
            <span class="chat-words-language">{{ LANGUAGES[language][0] }}</span>
            <span class="chat-words-count">{{ wordCount(language) }}</span>
          </span>
          <textarea v-model="texts[language]" class="create-game-text-input chat-words-input" spellcheck="false"
            :aria-label="$t('Chat: blocked words') + ' · ' + LANGUAGES[language][1]"></textarea>
        </label>
      </div>
      <div class="server-settings-actions chat-words-actions">
        <p class="server-settings-message" :class="{'server-settings-message--error': messageIsError}">{{ message }}</p>
        <button type="button" class="btn btn-tone-quiet" :disabled="busy" @click="texts = toTexts(defaults)" v-i18n>Reset to default</button>
        <button type="button" class="btn btn-primary" :disabled="busy || !dirty" @click="save" v-i18n>Save</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {ALL_LANGUAGES, LANGUAGE, LANGUAGES} from '@/common/constants';
import {ChatWordLists, ChatWordsModel} from '@/common/lobby/LobbyChatModel';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {translateText} from '@/client/directives/i18n';
import LanguageFlag from '@/client/components/LanguageFlag.vue';

type Texts = Record<LANGUAGE, string>;

// Room below the columns for the page's bottom padding and the legal note of the footer
const BOTTOM_ROOM = 100;
// Below this width the columns wrap into many rows: the page scrolls, every list keeps a fixed height
const MIN_FILL_WIDTH = 600;
// Narrowest column and the gap between columns (admin_settings.less): how many columns fit in a row
const MIN_COLUMN_WIDTH = 120;
const COLUMN_GAP = 10;

const languages = ALL_LANGUAGES;
const root = ref<HTMLElement | null>(null);
const grid = ref<HTMLElement | null>(null);
// Columns per row: as few rows as the width allows, the languages spread evenly over them (17 → 9 + 8, not 13 + 4)
const columnsPerRow = ref<number>(ALL_LANGUAGES.length);
const height = ref<number | undefined>(undefined);
const status = ref<'loading' | 'done'>('loading');
const texts = ref<Texts>(toTexts(undefined));
const saved = ref<Texts>(toTexts(undefined));
const defaults = ref<ChatWordLists | undefined>(undefined);
const busy = ref(false);
const message = ref('');
const messageIsError = ref(false);

function toTexts(lists: ChatWordLists | undefined): Texts {
  return Object.fromEntries(ALL_LANGUAGES.map((language) => [language, (lists?.[language] ?? []).join('\n')])) as Texts;
}

function words(text: string): Array<string> {
  return text.split('\n').map((word) => word.trim()).filter((word) => word !== '');
}

function wordCount(language: LANGUAGE): number {
  return words(texts.value[language]).length;
}

const dirty = computed(() => ALL_LANGUAGES.some((language) => words(texts.value[language]).join('\n') !== words(saved.value[language]).join('\n')));

function apply(model: ChatWordsModel): void {
  texts.value = toTexts(model.words);
  saved.value = toTexts(model.words);
  defaults.value = model.defaults;
}

function fitColumns(): void {
  const width = grid.value?.clientWidth ?? 0;
  const fitting = Math.max(1, Math.floor((width + COLUMN_GAP) / (MIN_COLUMN_WIDTH + COLUMN_GAP)));
  const rows = Math.ceil(ALL_LANGUAGES.length / fitting);
  columnsPerRow.value = Math.ceil(ALL_LANGUAGES.length / rows);
}

// The section ends at the bottom edge of the window: its height is what is left below its top
function fitHeight(): void {
  fitColumns();
  const element = root.value;
  if (element === null || window.innerWidth < MIN_FILL_WIDTH) {
    height.value = undefined;
    return;
  }
  const top = element.getBoundingClientRect().top + window.scrollY;
  height.value = Math.max(320, window.innerHeight - top - BOTTOM_ROOM);
}

async function load(): Promise<void> {
  try {
    apply(await (await fetchOrFail(paths.API_ADMIN_CHAT_WORDS)).json());
  } catch (error) {
    message.value = describeFailure(failureOf(error));
    messageIsError.value = true;
  }
  status.value = 'done';
  await nextTick();
  fitHeight();
}

async function save(): Promise<void> {
  busy.value = true;
  try {
    const lists = Object.fromEntries(ALL_LANGUAGES.map((language) => [language, words(texts.value[language])]));
    const response = await fetchOrFail(paths.API_ADMIN_CHAT_WORDS, {method: 'POST', body: JSON.stringify({words: lists})});
    apply(await response.json());
    message.value = translateText('Saved. The chat uses the list right away.');
    messageIsError.value = false;
  } catch (error) {
    message.value = translateText('Could not save:') + ' ' + describeFailure(failureOf(error));
    messageIsError.value = true;
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  window.addEventListener('resize', fitHeight);
  fitHeight();
  void load();
});

onBeforeUnmount(() => window.removeEventListener('resize', fitHeight));
</script>
