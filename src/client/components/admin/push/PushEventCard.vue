<template>
  <!-- One message of the catalog (pushCatalog.ts): description on the left, preview and test on the right -->
  <section class="games-overview-card push-event" :data-kind="entry.kind">
    <header class="push-event-head">
      <h2 v-i18n>{{ entry.title }}</h2>
      <code class="push-kind">{{ entry.kind }}</code>
      <span class="push-channel" :class="'push-channel--' + entry.channel" v-i18n>{{ entry.channel === 'push' ? 'Push' : 'Browser only, no push' }}</span>
    </header>
    <div class="push-event-spec">
      <dl class="push-rows">
        <template v-for="row in entry.rows" :key="row.label">
          <dt v-i18n>{{ row.label }}</dt>
          <dd v-i18n>{{ row.text }}</dd>
        </template>
        <dt v-i18n>Code</dt>
        <dd><code>{{ entry.code }}</code></dd>
      </dl>
      <div v-if="entry.parameters.length > 0" class="push-group">
        <h3 v-i18n>Parameters</h3>
        <table class="push-parameters">
          <tr v-for="parameter in entry.parameters" :key="parameter.name">
            <td><code>{{ parameter.name }}</code></td>
            <td><code v-if="parameter.value !== undefined">{{ parameter.value }}</code> <span v-i18n>{{ parameter.description }}</span></td>
          </tr>
        </table>
      </div>
      <div class="push-group">
        <h3 v-i18n>Deep link</h3>
        <p class="push-link"><code v-if="entry.deepLink !== undefined">{{ entry.deepLink }}</code> <span class="games-overview-note" v-i18n>{{ entry.deepLinkNote }}</span></p>
      </div>
    </div>
    <div class="push-preview">
      <div class="push-preview-head">
        <h3 v-i18n>Preview</h3>
        <!-- The viewer's language and the English source; English only when that is the viewer's language anyway -->
        <div v-if="ownLanguage !== 'en'" class="push-preview-languages">
          <button v-for="language in [ownLanguage, 'en']" :key="language" type="button" class="btn btn-sm btn-tone-quiet"
            :aria-pressed="language === previewLanguage" @click="previewLanguage = language">{{ language.toUpperCase() }}</button>
        </div>
      </div>
      <div class="push-notification">
        <img class="push-notification-icon" :src="icon" alt="">
        <span class="push-notification-source">{{ host }}</span>
        <strong class="push-notification-title"><template v-for="(part, index) in titleParts" :key="index"><mark v-if="part.isName">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></strong>
        <span class="push-notification-body">{{ previewText.body.replace('${0}', SAMPLE_NAME) }}</span>
      </div>
      <template v-if="entry.channel === 'push'">
        <button type="button" class="btn btn-sm btn-tone-quiet push-test" :disabled="testState === 'sending'" @click="sendTest" v-i18n>Send test to this browser</button>
        <p v-if="testMessage !== ''" class="games-overview-note" :class="{'games-overview-note--error': testState === 'failed'}">{{ testMessage }}</p>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {paths} from '@/common/app/paths';
import {LOBBY_PUSH_OUTCOME, LOBBY_PUSH_TEST_TAG, LobbyPushKind, LobbyPushOutcome, LobbyPushText} from '@/common/lobby/LobbyPushModel';
import {AdminPushTestRequest, AdminPushTestResponse} from '@/common/admin/AdminPushModel';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {describeFailure, failureOf, fetchOrFail} from '@/client/utils/requestFailure';
import {lobbyParticipantId} from '@/client/components/lobby/lobbyProfile';
import {PushCatalogEntry} from './pushCatalog';
import {pushTestDelaySeconds} from './pushTestDelay';

// icon: the picture the messages carry (the server's favicon, AdminPushInfo)
const props = defineProps<{entry: PushCatalogEntry, icon: string}>();

// Stands for whoever caused the message, as in the server's test messages (ApiAdminPush.ts)
const SAMPLE_NAME = 'Bob';

const ownLanguage = getPreferences().lang;
const previewLanguage = ref<string>(ownLanguage);
const host = window.location.host;

const previewText = computed((): LobbyPushText => previewLanguage.value === 'en' ? props.entry.text :
  {title: translateText(props.entry.text.title), body: translateText(props.entry.text.body)});

// The name of the parameter ${0} stands out in the preview
const titleParts = computed(() => previewText.value.title.split('${0}').flatMap((text, index) =>
  index === 0 ? [{text, isName: false}] : [{text: SAMPLE_NAME, isName: true}, {text, isName: false}]));

const testState = ref<'idle' | 'sending' | 'failed'>('idle');
const testMessage = ref('');

// What the server could do with the test message
const SERVER_RESULTS: Record<Exclude<AdminPushTestResponse['result'], 'sent' | 'muted'>, string> = {
  unreachable: 'This browser has no subscription: open the lobby and allow notifications.',
  gone: 'The subscription of this browser is gone: open the lobby again.',
};

// What became of it in this browser (reported by the service worker, client/sw.ts); timeout: nothing arrived
type BrowserOutcome = LobbyPushOutcome['outcome'] | 'timeout';
const BROWSER_RESULTS: Record<BrowserOutcome, string> = {
  shown: 'The push reached this browser and was handed to the system. If no notification appears, the system blocks it: allow notifications for this browser in the system settings and check Focus or Do Not Disturb.',
  toast: 'The push reached this browser and appears as a message on this page: a tab of this site is in front. Switch to another app to get the system notification.',
  failed: 'The push reached this browser, but the browser refused to show it: check the notification permission of this site.',
  timeout: 'The push service accepted the message, but it did not reach this browser within 15 seconds.',
};
const OUTCOME_WAIT_MS = 15_000;

// Waits for the service worker's report about the test message; resolves 'timeout' without one
function browserOutcome(): Promise<BrowserOutcome> {
  return new Promise((resolve) => {
    const container = navigator.serviceWorker;
    if (container === undefined) {
      resolve('timeout');
      return;
    }
    const finish = (outcome: BrowserOutcome) => {
      container.removeEventListener('message', listen);
      clearTimeout(timer);
      resolve(outcome);
    };
    const listen = (event: MessageEvent) => {
      const report = event.data as Partial<LobbyPushOutcome> | undefined;
      if (report?.type === LOBBY_PUSH_OUTCOME && report.tag === LOBBY_PUSH_TEST_TAG && report.outcome !== undefined) {
        finish(report.outcome);
      }
    };
    const timer = setTimeout(() => finish('timeout'), OUTCOME_WAIT_MS);
    container.addEventListener('message', listen);
    container.startMessages();
  });
}

// Browsers (e.g. Arc) show no banner while a tab of the same site is in front: the countdown (delay set at the
// top of the page) leaves time to switch to another app, as in real use with the lobby in the background
async function countdown(): Promise<void> {
  for (let seconds = pushTestDelaySeconds.value; seconds > 0; seconds--) {
    testMessage.value = translateTextWithParams('Sending in ${0} s: switch to another app or tab now.', [String(seconds)]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function sendTest(): Promise<void> {
  testState.value = 'sending';
  await countdown();
  testMessage.value = translateText('Test sent: waiting for this browser…');
  const body: AdminPushTestRequest = {kind: props.entry.kind as LobbyPushKind, me: lobbyParticipantId()};
  try {
    // Listen before sending: the report can come faster than the answer of the server
    const outcome = browserOutcome();
    const response = await fetchOrFail(paths.API_ADMIN_PUSH, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    const {result}: AdminPushTestResponse = await response.json();
    // Tests ignore switched-off kinds on the server, so 'muted' never comes back here
    if (result !== 'sent' && result !== 'muted') {
      testState.value = 'failed';
      testMessage.value = translateText(SERVER_RESULTS[result]);
      return;
    }
    const arrived = await outcome;
    testState.value = arrived === 'shown' || arrived === 'toast' ? 'idle' : 'failed';
    testMessage.value = translateText(BROWSER_RESULTS[arrived]);
  } catch (error) {
    testState.value = 'failed';
    testMessage.value = describeFailure(failureOf(error));
  }
}
</script>
