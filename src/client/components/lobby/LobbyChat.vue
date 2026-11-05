<template>
  <!-- Chat of the lobby: one room for everybody; links only to this server, blocked words masked (server/lobby/LobbyChat.ts) -->
  <section class="create-game-card lobby-chat">
    <div class="lobby-section-title"><span v-i18n>Chat</span></div>
    <div ref="list" class="lobby-chat-messages" aria-live="polite">
      <p v-if="messages.length === 0" class="lobby-dialog-note lobby-chat-empty" v-i18n>No messages yet. Say hello!</p>
      <div v-for="message in messages" :key="message.id" class="lobby-chat-message" :class="{'lobby-chat-message--you': message.you}">
        <LobbyAvatar kind="human" :color="message.color" :emoji="message.emoji" size="small" />
        <div class="lobby-chat-body">
          <div class="lobby-chat-meta">
            <span class="lobby-chat-name">{{ message.name }}</span>
            <time class="lobby-chat-time" :datetime="new Date(message.at).toISOString()">{{ clockTime(message.at) }}</time>
          </div>
          <div class="lobby-chat-text">
            <template v-for="(part, index) in chatTextParts(message.text)" :key="index">
              <a v-if="part.href !== undefined" :href="part.href">{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </div>
        </div>
      </div>
    </div>
    <form class="lobby-chat-form" @submit.prevent="send">
      <input v-model="draft" class="create-game-text-input lobby-chat-input" type="text" :maxlength="LOBBY_CHAT_MAX_LENGTH"
        :placeholder="$t('Write a message')" :aria-label="$t('Write a message')">
      <!-- Enter in the field submits the form (one text field); the button sends the same way -->
      <AppButton title="Send" :disabled="draft.trim() === '' || sending" @click="send" />
    </form>
    <p v-if="error !== ''" class="lobby-error lobby-chat-error">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {LOBBY_CHAT_MAX_LENGTH, LobbyChatMessage} from '@/common/lobby/LobbyChatModel';
import {LobbyProfile} from '@/common/lobby/LobbyModel';
import AppButton from '@/client/components/common/AppButton.vue';
import LobbyAvatar from './LobbyAvatar.vue';
import {chatTextParts, fetchLobbyChat, postLobbyChat} from './lobbyChatApi';
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
  void refresh();
  timer = setInterval(refresh, POLL_MS);
});

onBeforeUnmount(() => clearInterval(timer));
</script>
