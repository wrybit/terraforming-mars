<template>
  <!-- Chat of the lobby: one room for everybody; links only to this server, blocked words masked (server/lobby/LobbyChat.ts) -->
  <section class="create-game-card lobby-chat">
    <div class="lobby-section-title"><span v-i18n>Chat</span></div>
    <div ref="list" class="lobby-chat-messages" aria-live="polite">
      <p v-if="messages.length === 0" class="lobby-dialog-note lobby-chat-empty" v-i18n>No messages yet. Say hello!</p>
      <div v-for="message in messages" :key="message.id" class="lobby-chat-message"
        :class="{'lobby-chat-message--you': message.you, 'lobby-chat-message--editing': editingId === message.id, 'lobby-chat-message--updated': updatedId === message.id}">
        <LobbyAvatar kind="human" :color="message.color" :emoji="message.emoji" size="small" />
        <div class="lobby-chat-body">
          <div class="lobby-chat-meta">
            <span class="lobby-chat-name">{{ message.name }}</span>
            <time class="lobby-chat-time" :datetime="new Date(message.at).toISOString()">{{ clockTime(message.at) }}</time>
            <span v-if="message.edited" class="lobby-chat-edited" v-i18n>(edited)</span>
          </div>
          <!-- Inline edit: Enter saves, Esc cancels; the server checks the hour and the admin login again -->
          <form v-if="editingId === message.id" class="lobby-chat-edit" @submit.prevent="saveEdit(message)">
            <textarea ref="editField" v-model="editDraft" v-auto-grow class="lobby-chat-edit-field" rows="1" :maxlength="LOBBY_CHAT_MAX_LENGTH"
              :aria-label="$t('Edit message')" @keydown.enter.exact.prevent="saveEdit(message)" @keydown.esc.stop.prevent="cancelEdit"></textarea>
            <div class="lobby-chat-edit-actions">
              <AppButton size="small" class="btn-tone-quiet" title="Cancel" :fixedHotkey="['Escape']" @click="cancelEdit" />
              <AppButton size="small" title="Save" :fixedHotkey="['Enter']" :disabled="editDraft.trim() === '' || saving" @click="saveEdit(message)" />
            </div>
          </form>
          <div v-else class="lobby-chat-text" :class="{'lobby-chat-text--emoji': isEmojiOnly(message.text)}">
            <template v-for="(part, index) in chatTextParts(message.text)" :key="index">
              <a v-if="part.href !== undefined" :href="part.href">{{ part.text }}</a>
              <span v-else-if="part.tag" class="lobby-chat-tag">{{ part.text }}</span>
              <template v-else>{{ part.text }}</template>
            </template>
          </div>
        </div>
        <button v-if="message.editable && editingId !== message.id" type="button" class="lobby-chat-edit-button"
          :title="$t('Edit message')" :aria-label="$t('Edit message')" @click="startEdit(message)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 10-10-3-3L5 16z" /><path d="M13 7l3 3" /></svg>
        </button>
      </div>
    </div>
    <!-- One field with the emoji and the send button inside; Enter sends too -->
    <form class="lobby-chat-form" @submit.prevent="send">
      <div class="lobby-chat-field">
        <!-- Grows with the text up to five lines; Enter sends, Shift+Enter starts a new line -->
        <textarea ref="input" v-model="draft" v-auto-grow class="lobby-chat-input" rows="1" :maxlength="LOBBY_CHAT_MAX_LENGTH"
          :placeholder="$t('Write a message')" :aria-label="$t('Write a message')" @focus="focused = true" @blur="focused = false"
          @keydown.enter.exact.prevent="send" @keydown.esc="leaveField"></textarea>
        <!-- Enter anywhere on the page jumps into the field (onPageKey); the key cap shows it while the field is idle -->
        <HotkeyKeys v-if="!focused && draft === ''" :fixed="['Enter']" />
        <button type="button" class="lobby-chat-icon-button" :class="{'lobby-chat-icon-button--open': emojisOpen}" :title="$t('Emoji')" :aria-label="$t('Emoji')"
          :aria-expanded="emojisOpen" @click="emojisOpen = !emojisOpen">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>
        </button>
        <button type="submit" class="lobby-chat-icon-button lobby-chat-send" :title="$t('Send message')" :aria-label="$t('Send message')" :disabled="draft.trim() === '' || sending">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-4 16-4-6.5L4 12Z" /><path d="M12 13.5 20 4" /></svg>
        </button>
        <!-- Popover above the field; a click outside or Escape closes it -->
        <div v-if="emojisOpen" class="lobby-chat-emojis" role="listbox" :aria-label="$t('Emoji')" @keydown.esc.stop="emojisOpen = false">
          <button v-for="emoji in CHAT_EMOJIS" :key="emoji" type="button" class="lobby-chat-emoji" role="option" @click="insertEmoji(emoji)">{{ emoji }}</button>
        </div>
      </div>
    </form>
    <p v-if="error !== ''" class="lobby-error lobby-chat-error">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {LOBBY_CHAT_MAX_LENGTH, LobbyChatMessage} from '@/common/lobby/LobbyChatModel';
import {LobbyProfile} from '@/common/lobby/LobbyModel';
import LobbyAvatar from './LobbyAvatar.vue';
import {chatTextParts, editLobbyChat, fetchLobbyChat, postLobbyChat} from './lobbyChatApi';
import AppButton from '@/client/components/common/AppButton.vue';
import {CHAT_EMOJIS, isEmojiOnly} from './lobbyChatEmoji';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import {vAutoGrow} from '@/client/directives/AutoGrow';
import {hotkeysAvailable} from '@/client/hotkeys/hotkeyAvailability';
import {lobbyFailureText} from './lobbyApi';

const props = defineProps<{
  profile: LobbyProfile;
  /** Asks the page for a profile first (no name yet), then runs the action */
  withProfile: (action: () => void) => void;
}>();

// Same rhythm as the lobby list
const POLL_MS = 2500;

const messages = ref<Array<LobbyChatMessage>>([]);
const draft = ref('');
const sending = ref(false);
const error = ref('');
const list = ref<HTMLElement | null>(null);
const input = ref<HTMLTextAreaElement | null>(null);
const emojisOpen = ref(false);
const focused = ref(false);
const editingId = ref<number | undefined>(undefined);
const editDraft = ref('');
const saving = ref(false);
// Briefly highlights the message just saved, so one sees the change arrived
const updatedId = ref<number | undefined>(undefined);
const editField = ref<Array<HTMLTextAreaElement>>([]);
const UPDATED_FLASH_MS = 1500;
let updatedTimer: ReturnType<typeof setTimeout> | undefined;

async function startEdit(message: LobbyChatMessage): Promise<void> {
  editingId.value = message.id;
  editDraft.value = message.text;
  error.value = '';
  await nextTick();
  const field = editField.value[0];
  // The buttons below the field must be visible too, also at the bottom of the list
  field?.closest('.lobby-chat-message')?.scrollIntoView({block: 'nearest'});
  field?.focus({preventScroll: true});
  field?.setSelectionRange(field.value.length, field.value.length);
}

function cancelEdit(): void {
  editingId.value = undefined;
  editDraft.value = '';
}

async function saveEdit(message: LobbyChatMessage): Promise<void> {
  const text = editDraft.value.trim();
  if (text === '' || saving.value) {
    return;
  }
  if (text === message.text) {
    cancelEdit();
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    await show((await editLobbyChat(message.id, text)).messages);
    cancelEdit();
    updatedId.value = message.id;
    clearTimeout(updatedTimer);
    updatedTimer = setTimeout(() => updatedId.value = undefined, UPDATED_FLASH_MS);
  } catch (failure) {
    error.value = lobbyFailureText(failure);
  } finally {
    saving.value = false;
  }
}

// Esc leaves the field (the emoji popover first, if open); Enter brings you back in
function leaveField(event: KeyboardEvent): void {
  event.stopPropagation();
  if (emojisOpen.value) {
    emojisOpen.value = false;
    return;
  }
  input.value?.blur();
}

// Enter on the page (not on a button, link or field, and with no dialog open) puts the cursor into the chat
function onPageKey(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !hotkeysAvailable.value) {
    return;
  }
  // Enter on a focused button or link presses it, in a field it does what the field does
  const target = event.target;
  if (target instanceof Element && target.closest('button, a, input, textarea, select, [contenteditable]') !== null) {
    return;
  }
  if (document.querySelector('.sidebar-modal-backdrop, .lobby-create-overlay') !== null) {
    return;
  }
  event.preventDefault();
  input.value?.focus();
}

// At the cursor (or at the end), then the cursor goes behind the emoji and the field keeps the focus
async function insertEmoji(emoji: string): Promise<void> {
  const field = input.value;
  const start = field?.selectionStart ?? draft.value.length;
  const end = field?.selectionEnd ?? start;
  const next = draft.value.slice(0, start) + emoji + draft.value.slice(end);
  if (Array.from(next).length > LOBBY_CHAT_MAX_LENGTH) {
    return;
  }
  draft.value = next;
  emojisOpen.value = false;
  await nextTick();
  field?.focus();
  field?.setSelectionRange(start + emoji.length, start + emoji.length);
}

// Click outside the popover and its button closes it
function onDocumentClick(event: MouseEvent): void {
  const target = event.target as Element | null;
  if (emojisOpen.value && target?.closest('.lobby-chat-emojis, .lobby-chat-icon-button--open') === null) {
    emojisOpen.value = false;
  }
}
let timer: ReturnType<typeof setInterval> | undefined;

// 24-hour clock in every language: the app's language codes are no browser locales (cn, br, jp …)
function clockTime(at: number): string {
  const time = new Date(at);
  return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
}

// New messages scroll into view, unless one is reading further up
async function show(next: Array<LobbyChatMessage>): Promise<void> {
  const element = list.value;
  const atBottom = element === null || element.scrollHeight - element.scrollTop - element.clientHeight < 40;
  const changed = next.length !== messages.value.length || next[next.length - 1]?.id !== messages.value[messages.value.length - 1]?.id;
  messages.value = next;
  if (changed && atBottom) {
    await nextTick();
    list.value?.scrollTo({top: list.value.scrollHeight});
  }
}

async function refresh(): Promise<void> {
  try {
    await show((await fetchLobbyChat()).messages);
  } catch {
    // The lobby list shows connection problems already
  }
}

function send(): void {
  const text = draft.value.trim();
  if (text === '' || sending.value) {
    return;
  }
  props.withProfile(async () => {
    sending.value = true;
    error.value = '';
    try {
      const model = await postLobbyChat(props.profile, text);
      draft.value = '';
      await show(model.messages);
      list.value?.scrollTo({top: list.value.scrollHeight});
    } catch (failure) {
      error.value = lobbyFailureText(failure);
    } finally {
      sending.value = false;
    }
  });
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('keydown', onPageKey);
  void refresh();
  timer = setInterval(refresh, POLL_MS);
});

onBeforeUnmount(() => {
  clearInterval(timer);
  clearTimeout(updatedTimer);
  document.removeEventListener('click', onDocumentClick);
  window.removeEventListener('keydown', onPageKey);
});
</script>
