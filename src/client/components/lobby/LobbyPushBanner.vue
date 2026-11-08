<template>
  <!-- Bar over the full width while this browser may not show push messages (lobbyPush.ts); pushes the page down -->
  <div v-if="state !== 'granted' && !dismissed" class="lobby-push-banner" role="status">
    <svg class="lobby-push-banner-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 0 0-9.3-5M6 9.5V16l-2 2h13M10 21h4M3 3l18 18" />
    </svg>
    <div class="lobby-push-banner-text">
      <strong v-i18n>{{ TITLES[state] }}</strong>
      <span v-i18n>{{ state === 'unsupported' ? 'Keep the lobby in front to notice when somebody joins your game or it starts.' : 'With the lobby in the background you will not notice when somebody joins your game or it starts.' }}</span>
      <!-- Blocked: pages cannot reopen the browser's question, only the settings can (notificationSettingsHelp.ts) -->
      <span v-if="steps !== undefined" class="lobby-push-banner-steps" v-i18n>{{ steps }}</span>
    </div>
    <button v-if="state === 'default'" type="button" class="btn btn-primary lobby-push-banner-button" @click="allow" v-i18n>Allow notifications</button>
    <button v-else-if="state === 'denied'" type="button" class="btn lobby-push-banner-button" @click="check" v-i18n>Check again</button>
    <!-- Whoever does not want push messages at all closes the bar for good (in this browser) -->
    <button type="button" class="lobby-push-banner-close" :title="$t('Close')" :aria-label="$t('Close')" @click="dismiss">×</button>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';
import {askLobbyPushPermission, pushSupported, subscribeLobbyPush} from './lobbyPush';
import {BLOCKED_STEPS, browserFamily, UNSUPPORTED_STEPS} from './notificationSettingsHelp';

// unsupported: no push in this browser at all (e.g. iPhone without the page on the home screen)
type PushState = 'default' | 'denied' | 'granted' | 'unsupported';

const TITLES: Record<Exclude<PushState, 'granted'>, string> = {
  default: 'Push messages are off',
  denied: 'Notifications are blocked',
  unsupported: 'This browser cannot receive push messages',
};

const family = browserFamily(navigator.userAgent, navigator.maxTouchPoints);
const DISMISSED_KEY = 'tm-lobby-push-banner-closed';
const dismissed = ref(safeLocalStorage.getItem(DISMISSED_KEY) === 'true');

function dismiss(): void {
  dismissed.value = true;
  safeLocalStorage.setItem(DISMISSED_KEY, 'true');
}

function currentState(): PushState {
  return pushSupported() ? Notification.permission : 'unsupported';
}

const state = ref<PushState>(currentState());
const steps = computed(() => state.value === 'denied' ? BLOCKED_STEPS[family] : state.value === 'unsupported' ? UNSUPPORTED_STEPS[family] : undefined);

// Allowed (here or in the settings): register the subscription at once, so the server can reach this browser
function update(): void {
  const before = state.value;
  state.value = currentState();
  if (state.value === 'granted' && before !== 'granted') {
    void subscribeLobbyPush();
  }
}

// Within the click: browsers ask for the permission only after a user action
function allow(): void {
  void askLobbyPushPermission()?.then(update);
}

// Some browsers report a change in the settings only after this check (no change event)
function check(): void {
  update();
}

// The permission can also change in the browser settings while the lobby is open
let status: PermissionStatus | undefined;
onMounted(async () => {
  window.addEventListener('focus', update);
  try {
    status = await navigator.permissions?.query({name: 'notifications'});
    status?.addEventListener('change', update);
  } catch {
    // Without the Permissions API the check on focus and the button remain
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('focus', update);
  status?.removeEventListener('change', update);
});
</script>
