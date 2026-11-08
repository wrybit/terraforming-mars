<template>
  <!-- Bar over the full width while this browser may not show push messages (lobbyPush.ts); pushes the page down -->
  <div v-if="state !== 'granted' && !dismissed" class="lobby-push-banner" role="status">
    <div class="lobby-push-banner-text">
      <!-- Floats: the text runs beside and below it, also on phones (no own line for the symbol) -->
      <svg class="lobby-push-banner-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 16v-5a6 6 0 0 0-9.3-5M6 9.5V16l-2 2h13M10 21h4M3 3l18 18" />
      </svg>
      <!-- Short and in three steps: what is missing, what it is used for, what to do -->
      <strong class="lobby-push-banner-title" v-i18n>{{ TITLES[state] }}</strong>
      <span class="lobby-push-banner-purpose" v-i18n>Only for your games: somebody joins, asks to join, the game starts.</span>
      <!-- Blocked: pages cannot reopen the browser's question, only the settings can (notificationSettingsHelp.ts).
           Every step a chip with the browser's own words and symbols, so it can be found on screen -->
      <span v-if="path !== undefined" class="lobby-push-banner-steps">
        <span v-if="path.lead" class="lobby-push-banner-lead">{{ $t(path.lead) }}</span>
        <!-- Arrow and chip wrap together, so no line ends with an arrow -->
        <span v-for="(step, index) in path.steps" :key="index" class="lobby-push-banner-step">
          <span v-if="index > 0" class="lobby-push-banner-arrow" aria-hidden="true">→</span>
          <span class="lobby-push-banner-chip">
            <svg v-for="icon in step.icons ?? []" :key="icon" class="lobby-push-banner-chip-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path :d="ICON_PATHS[icon]" />
            </svg>
            <template v-if="step.name ?? step.label">{{ step.name ?? $t(step.label ?? "") }}</template>
          </span>
        </span>
        <span v-if="path.tail" class="lobby-push-banner-lead">{{ $t(path.tail) }}</span>
      </span>
      <span v-else-if="state === 'unsupported'" v-i18n>Keep the lobby in front to see them.</span>
      <!-- "settings" as a link straight to the switches per kind (settings dialog of the setup menu) -->
      <span v-if="state !== 'unsupported'" class="lobby-push-banner-hint">{{ hintParts[0] }}<a href="#" class="lobby-push-banner-link" @click.prevent="openMenuDialog('settings')">{{ $t('settings') }}</a>{{ hintParts[1] }}</span>
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
import {BLOCKED_PATHS, browserFamily, isArcBrowser, StepIcon, UNSUPPORTED_PATHS} from './notificationSettingsHelp';
import {openMenuDialog} from '@/client/components/gameMenu/gameMenuDialog';
import {translateText} from '@/client/directives/i18n';

// unsupported: no push in this browser at all (e.g. iPhone without the page on the home screen)
type PushState = 'default' | 'denied' | 'granted' | 'unsupported';

const TITLES: Record<Exclude<PushState, 'granted'>, string> = {
  default: 'Push messages are off',
  denied: 'Notifications are blocked',
  unsupported: 'This browser cannot receive push messages',
};

// Outlines in the style of the browsers' own symbols (lock and sliders in the address field, Share on iOS)
const ICON_PATHS: Record<StepIcon, string> = {
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  share: 'M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1',
};

// Arc only shows itself through its colour variables, which it sets shortly after loading (see onMounted)
const family = ref(browserFamily(navigator.userAgent, navigator.maxTouchPoints, isArcBrowser()));
function detectBrowser(): void {
  family.value = browserFamily(navigator.userAgent, navigator.maxTouchPoints, isArcBrowser());
}
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
// The sentence around the link, in the word order of the language (${0} = the link)
const hintParts = computed(() => {
  const [before, after = ''] = translateText('Each one can be switched off in the ${0}.').split('${0}');
  return [before, after];
});
const path = computed(() => state.value === 'denied' ? BLOCKED_PATHS[family.value] : state.value === 'unsupported' ? UNSUPPORTED_PATHS[family.value] : undefined);

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
  window.setTimeout(detectBrowser, 1000);
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
