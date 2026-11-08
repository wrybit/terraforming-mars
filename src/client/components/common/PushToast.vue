<template>
  <!-- Push messages while a tab of this site is in front (client/sw.ts sends them here instead of a system notice) -->
  <div v-if="toasts.length > 0" class="push-toasts" role="status" aria-live="polite">
    <!-- Hover pauses the countdown (CSS animation-play-state): whoever reads it, keeps it -->
    <div v-for="toast in toasts" :key="toast.key" class="push-toast" :style="{'--push-toast-ms': `${VISIBLE_MS}ms`}">
      <img v-if="toast.message.icon !== undefined" class="push-toast-icon" :src="toast.message.icon" alt="">
      <div class="push-toast-text">
        <strong>{{ toast.message.title }}</strong>
        <span>{{ toast.message.body }}</span>
      </div>
      <a class="btn btn-sm btn-primary push-toast-open" :href="toast.message.url" v-i18n>Open</a>
      <button type="button" class="push-toast-close" :title="$t('Close')" @click="dismiss(toast.key)">×</button>
      <!-- Countdown: the bar runs out, then the message goes (its end closes it, so pausing needs no timer) -->
      <div class="push-toast-countdown" aria-hidden="true" @animationend="dismiss(toast.key)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {LOBBY_PUSH_TOAST, LobbyPushMessage, LobbyPushToast} from '@/common/lobby/LobbyPushModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {SoundManager} from '@/client/utils/SoundManager';

// Long enough to read, short enough not to pile up; a newer message of the same room replaces the older one (tag)
const VISIBLE_MS = 15_000;

type Toast = {key: number, message: LobbyPushMessage};
const toasts = ref<Array<Toast>>([]);
let nextKey = 0;

function dismiss(key: number): void {
  toasts.value = toasts.value.filter((toast) => toast.key !== key);
}

function onMessage(event: MessageEvent): void {
  const data = event.data as Partial<LobbyPushToast> | undefined;
  if (data?.type !== LOBBY_PUSH_TOAST || data.message === undefined) {
    return;
  }
  const key = nextKey++;
  toasts.value = [...toasts.value.filter((toast) => toast.message.tag !== data.message?.tag), {key, message: data.message}];
  // Same switch as the turn sound; browsers may block it until the first click on the page – then it stays silent
  if (getPreferences().enable_sounds) {
    SoundManager.pushToast();
  }
}

onMounted(() => {
  navigator.serviceWorker?.addEventListener('message', onMessage);
  navigator.serviceWorker?.startMessages();
});
onBeforeUnmount(() => navigator.serviceWorker?.removeEventListener('message', onMessage));
</script>
