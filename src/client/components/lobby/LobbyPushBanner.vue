<template>
  <!-- Bar over the full width while this browser may not show push messages (lobbyPush.ts); pushes the page down -->
  <div v-if="state !== 'granted'" class="lobby-push-banner" role="status">
    <svg class="lobby-push-banner-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 0 0-9.3-5M6 9.5V16l-2 2h13M10 21h4M3 3l18 18" />
    </svg>
    <span v-i18n>{{ MESSAGES[state] }}</span>
    <button v-if="state === 'default'" type="button" class="btn btn-sm btn-primary lobby-push-banner-button" @click="allow" v-i18n>Allow notifications</button>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {askLobbyPushPermission, pushSupported, subscribeLobbyPush} from './lobbyPush';

// unsupported: no push in this browser at all (e.g. iPhone without the page on the home screen)
type PushState = 'default' | 'denied' | 'granted' | 'unsupported';

const MESSAGES: Record<Exclude<PushState, 'granted'>, string> = {
  default: 'Push messages are off: with the lobby in the background you will not notice when somebody joins your game or it starts.',
  denied: 'Notifications are blocked: with the lobby in the background you will not notice when somebody joins your game or it starts. Allow them for this site in the browser settings.',
  unsupported: 'This browser cannot receive push messages: keep the lobby in front to notice when somebody joins your game or it starts.',
};

function currentState(): PushState {
  return pushSupported() ? Notification.permission : 'unsupported';
}

const state = ref<PushState>(currentState());

// Within the click: browsers ask for the permission only after a user action
function allow(): void {
  const permission = askLobbyPushPermission();
  void permission?.then((answer) => {
    state.value = currentState();
    if (answer === 'granted') {
      void subscribeLobbyPush();
    }
  });
}

// The permission can also change in the browser settings while the lobby is open
let status: PermissionStatus | undefined;
const update = () => state.value = currentState();
onMounted(async () => {
  try {
    status = await navigator.permissions?.query({name: 'notifications'});
    status?.addEventListener('change', update);
  } catch {
    // Without the Permissions API the state is checked again on the next visit
  }
});
onBeforeUnmount(() => status?.removeEventListener('change', update));
</script>
