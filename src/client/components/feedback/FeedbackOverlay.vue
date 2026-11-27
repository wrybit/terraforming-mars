<template>
  <!-- Feedback overlay (key O, menu → Feedback or shaking): screenshot with points and areas on the left, text, markers
       and technical details on the right; the send button stays at the bottom. Without delivery on the server the
       report becomes a GitHub issue of the tester (no contact fields then: their GitHub account is the contact). -->
  <Teleport to="body">
    <div v-if="open" class="feedback-overlay">
      <div class="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <header class="feedback-head">
          <h1 id="feedback-title" class="feedback-head__title" v-i18n>Feedback</h1>
          <button type="button" class="feedback-head__close" :aria-label="translateText('Close')" @click="close">✕</button>
        </header>

        <div class="feedback-body">
          <FeedbackScreenshot :imageUrl="imageUrl" :imageWidth="imageWidth" :imageHeight="imageHeight" :captureFailed="captureFailed"
            :markers="markers" :crop="crop" :hot="hot"
            @add="addMarker" @move="moveMarker" @update:crop="crop = $event" @focus="focusMarker" @hover="hot = $event" />

          <aside class="feedback-side">
            <form v-if="issueUrl === undefined" id="feedback-form" class="feedback-form" novalidate @submit.prevent="send">
              <section v-if="feedbackConfig.serverDelivery" class="feedback-section">
                <h2 class="feedback-section__title"><span v-i18n>Contact</span><small v-i18n>optional</small></h2>
                <div class="feedback-contact">
                  <div class="feedback-field">
                    <label for="feedback-name" v-i18n>Name</label>
                    <input id="feedback-name" v-model="contact.name" autocomplete="name" :maxlength="FEEDBACK_LIMITS.contactLength">
                  </div>
                  <div class="feedback-field">
                    <label for="feedback-email" v-i18n>Email</label>
                    <input id="feedback-email" v-model="contact.email" type="email" autocomplete="email" :maxlength="FEEDBACK_LIMITS.contactLength"
                      :placeholder="translateText('For questions')">
                  </div>
                  <div class="feedback-field">
                    <label for="feedback-discord">Discord</label>
                    <input id="feedback-discord" v-model="contact.discord" :maxlength="FEEDBACK_LIMITS.contactLength">
                  </div>
                </div>
              </section>

              <section class="feedback-section">
                <h2 class="feedback-section__title"><label for="feedback-general" v-i18n>General</label></h2>
                <textarea id="feedback-general" v-model="general" rows="4" class="feedback-textarea" :maxlength="FEEDBACK_LIMITS.textLength"
                  :placeholder="translateText('What did you notice?')"></textarea>
              </section>

              <section class="feedback-section">
                <h2 class="feedback-section__title"><span v-i18n>Markers</span><small v-if="markers.length > 0">{{ markers.length }}</small></h2>
                <!-- How to mark, right where the markers will appear -->
                <div v-if="markers.length === 0" class="feedback-empty">
                  <span class="feedback-empty__way">
                    <FeedbackMarkerIcon kind="pin" :number="1" :scale="0.6" />
                    <span class="feedback-empty__pointer" v-i18n>Click: set a point</span>
                    <span class="feedback-empty__touch" v-i18n>Tap: set a point</span>
                  </span>
                  <span class="feedback-empty__way">
                    <FeedbackMarkerIcon kind="area" :number="2" :scale="0.7" />
                    <span v-i18n>Drag: mark an area</span>
                  </span>
                </div>
                <div v-for="marker in markers" :key="marker.number"
                  :class="['feedback-mark', {'is-hot': hot === marker.number, 'is-outside': !isInsideCrop(marker, crop)}]"
                  @mouseenter="hot = marker.number" @mouseleave="hot = undefined">
                  <span class="feedback-mark__icon"><FeedbackMarkerIcon :kind="marker.kind" :number="marker.number" :scale="0.8" /></span>
                  <textarea :id="'feedback-mark-' + marker.number" v-model="marker.text" rows="2" class="feedback-textarea feedback-mark__text"
                    :maxlength="FEEDBACK_LIMITS.textLength" :aria-label="markerLabel(marker)" :placeholder="translateText('What is going on here?')"
                    @input="grow" @focus="hot = marker.number" @blur="hot = undefined"></textarea>
                  <button type="button" class="feedback-mark__remove" :aria-label="translateText('Remove')" @click="removeMarker(marker.number)">✕</button>
                  <span v-if="!isInsideCrop(marker, crop)" class="feedback-mark__note" v-i18n>Outside the cropped area, will not be sent.</span>
                </div>
              </section>

              <!-- Sent along automatically: the game (who, what, which version) and the device, each folded away -->
              <details class="feedback-tech">
                <summary class="feedback-tech__summary">
                  <b v-i18n>Game data</b>
                  <span v-i18n>Players, settings and version</span>
                  <i class="feedback-tech__arrow" aria-hidden="true"></i>
                </summary>
                <dl class="feedback-tech__list">
                  <FeedbackGameSummary v-if="view !== undefined" :view="view" />
                  <template v-for="line in gameLines" :key="line.label">
                    <dt>{{ translateText(line.label) }}</dt>
                    <dd>{{ translateText(line.value) }}</dd>
                  </template>
                </dl>
              </details>
              <details class="feedback-tech">
                <summary class="feedback-tech__summary">
                  <b v-i18n>Technical details</b>
                  <span v-i18n>Device and browser</span>
                  <i class="feedback-tech__arrow" aria-hidden="true"></i>
                </summary>
                <dl class="feedback-tech__list">
                  <template v-for="line in deviceLines" :key="line.label">
                    <dt>{{ translateText(line.label) }}</dt>
                    <dd>{{ translateText(line.value) }}</dd>
                  </template>
                </dl>
              </details>
            </form>

            <!-- GitHub issue prepared: takes the place of the form, so the one step left cannot be missed – the
                 screenshot does not travel with the address, the tester has to paste it on GitHub -->
            <section v-else class="feedback-issue" role="status" aria-labelledby="feedback-issue-title">
              <h2 id="feedback-issue-title" class="feedback-issue__title" v-i18n>Almost done: paste the screenshot into the issue</h2>
              <figure class="feedback-issue__shot">
                <img v-if="sentScreenshot !== ''" :src="sentScreenshot" alt="">
                <figcaption v-if="copied" class="feedback-issue__state feedback-issue__state--ok" v-i18n>✓ In your clipboard</figcaption>
                <figcaption v-else class="feedback-issue__state" v-i18n>Not in your clipboard yet</figcaption>
              </figure>
              <button v-if="!copied" type="button" class="btn btn-primary feedback-issue__copy" @click="copyAgain" v-i18n>Copy screenshot</button>
              <ol class="feedback-issue__steps">
                <li>
                  <span class="feedback-issue__number">1</span>
                  <a class="btn btn-primary" :href="issueUrl" target="_blank" rel="noopener" v-i18n>Open GitHub</a>
                </li>
                <!-- The step people miss: highlighted -->
                <li class="feedback-issue__key-step">
                  <span class="feedback-issue__number">2</span>
                  <span v-if="touchDevice" v-i18n>Touch and hold the text field, then choose Paste</span>
                  <span v-else class="feedback-issue__paste">
                    <span v-i18n>Click into the text field and press</span>
                    <span class="feedback-issue__keys"><kbd>{{ pasteModifier }}</kbd><kbd>V</kbd></span>
                  </span>
                </li>
                <li>
                  <span class="feedback-issue__number">3</span>
                  <span v-i18n>Submit the issue on GitHub</span>
                </li>
              </ol>
              <button v-if="copied" type="button" class="btn btn-tone-quiet feedback-issue__again" @click="copyAgain" v-i18n>Copy screenshot again</button>
            </section>
            <div v-if="issueUrl === undefined" class="feedback-footer">
              <p v-if="error" class="feedback-footer__error" role="alert">{{ translateText(error) }}</p>
              <p v-else-if="feedbackConfig.serverDelivery" class="feedback-footer__note" v-i18n>Screenshot, game and technical details are sent along.</p>
              <p v-else class="feedback-footer__note" v-i18n>Becomes a public issue on GitHub, submitted with your GitHub account.</p>
              <button type="submit" form="feedback-form" :class="['btn', 'btn-primary', 'feedback-send', {'feedback-send--done': state === 'sent'}]"
                :disabled="state !== 'idle' || !hasContent" :title="hasContent ? '' : translateText('Write something first.')">
                {{ translateText(sendLabel) }}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {FEEDBACK_PATHS} from '@/common/feedback/feedbackPaths';
import {feedbackIssueUrl} from '@/common/feedback/feedbackIssue';
import {feedbackConfig} from './feedbackAvailability';
import {isMac} from '@/client/hotkeys/hotkeyEvents';
import {ViewModel} from '@/common/models/PlayerModel';
import {FEEDBACK_LIMITS, FeedbackDiagnostic, FeedbackReport, FeedbackResult} from '@/common/feedback/FeedbackReport';
import FeedbackMarkerIcon from './FeedbackMarkerIcon.vue';
import FeedbackScreenshot from './FeedbackScreenshot.vue';
import FeedbackGameSummary from './FeedbackGameSummary.vue';
import {Box, FULL_CROP, MarkerDraft, Point, isInsideCrop} from './feedbackGeometry';
import {captureVisiblePage, renderReportImage} from './feedbackScreenshot';
import {copyScreenshot} from './feedbackClipboard';
import {DEVICE_LABELS, GAME_LABELS, collectDiagnostics, linesInOrder} from './feedbackDiagnostics';
import {closeFeedback, feedbackOpen, isFeedbackHotkey, openFeedback} from './feedbackState';

const props = defineProps<{
  /** Player or spectator view of the current game, for the technical details */
  view: ViewModel | undefined;
}>();

type SendState = 'idle' | 'sending' | 'sent';

// What the server answers, as the message the tester reads (and how to go on)
const ERROR_MESSAGES: Record<Exclude<FeedbackResult['status'], 'sent'> | 'network', string> = {
  tooMany: 'You have sent a lot of feedback in a short time. Please try again in a few minutes.',
  failed: 'The server could not save the feedback. Your input stays here; please try again later.',
  network: 'No connection to the server. Your input stays here; please try again when you are online.',
};
// Contact data is remembered for the next feedback (only in this browser)
const CONTACT_STORAGE_KEY = 'tm-feedback-contact';
const SENT_CLOSE_DELAY_MS = 1500;
// Room for the texts and details next to the screenshot in the request
const TEXT_RESERVE_BYTES = 120_000;

const open = computed(() => feedbackOpen.value);
const contact = reactive({name: '', email: '', discord: ''});
const general = ref('');
const markers = ref<Array<MarkerDraft>>([]);
const crop = ref<Box>(FULL_CROP);
const hot = ref<number>();
const diagnostics = ref<Array<FeedbackDiagnostic>>([]);
const state = ref<SendState>('idle');
// Public issue of the last report and whether its screenshot reached the clipboard
const issueUrl = ref<string>();
const copied = ref(false);
const sentScreenshot = ref('');
// How to paste on this device: keys on a computer, a long touch on phones and tablets
const pasteModifier = isMac() ? '⌘' : 'Ctrl';
const touchDevice = typeof window !== 'undefined' && window.matchMedia?.('(hover: none) and (pointer: coarse)').matches === true;
const error = ref<string>();
const imageUrl = ref('');
const imageWidth = ref(0);
const imageHeight = ref(0);
const captureFailed = ref(false);
let source: HTMLCanvasElement | undefined;
let nextNumber = 1;

// Players, board, expansions and settings appear as pills and chips (FeedbackGameSummary.vue), not twice as text
const gameLines = computed(() => linesInOrder(diagnostics.value, GAME_LABELS));
const deviceLines = computed(() => linesInOrder(diagnostics.value, DEVICE_LABELS));
const hasContent = computed(() => general.value.trim() !== '' || markers.value.some((marker) => marker.text.trim() !== ''));
const sendLabel = computed(() => state.value === 'sending' ? 'Sending …' : state.value === 'sent' ? 'Thank you! Sent' : 'Send feedback');

function markerLabel(marker: MarkerDraft): string {
  return translateTextWithParams(marker.kind === 'pin' ? 'Point ${0}' : 'Area ${0}', [String(marker.number)]);
}

function loadContact(): void {
  try {
    Object.assign(contact, JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY) ?? '{}'));
  } catch {
    // No storage (private mode): the fields just start empty
  }
}

function saveContact(): void {
  try {
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
  } catch {
    // Not remembered, nothing else depends on it
  }
}

async function capture(): Promise<void> {
  imageUrl.value = '';
  captureFailed.value = false;
  source = undefined;
  try {
    // One frame so the menu that opened the overlay is gone before the page is drawn
    await new Promise((resolve) => requestAnimationFrame(resolve));
    source = await captureVisiblePage();
    imageWidth.value = source.width;
    imageHeight.value = source.height;
    const blob = await new Promise<Blob | null>((resolve) => source?.toBlob(resolve, 'image/png'));
    if (blob === null) {
      throw new Error('empty screenshot');
    }
    imageUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Feedback screenshot failed', e);
    captureFailed.value = true;
  }
}

function releaseImage(): void {
  if (imageUrl.value !== '') {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = '';
  }
}

async function copyAgain(): Promise<void> {
  copied.value = await copyScreenshot(sentScreenshot.value);
}

// Every opening shows the page as it is now; the text drafts stay until they are sent
function start(): void {
  issueUrl.value = undefined;
  copied.value = false;
  markers.value = [];
  crop.value = FULL_CROP;
  nextNumber = 1;
  state.value = 'idle';
  error.value = undefined;
  diagnostics.value = collectDiagnostics(props.view);
  void capture();
}

function close(): void {
  if (state.value === 'sending') {
    return;
  }
  closeFeedback();
}

function grow(event: Event): void {
  const field = event.target as HTMLTextAreaElement;
  field.style.height = 'auto';
  field.style.height = `${field.scrollHeight + 2}px`;
}

async function focusMarker(number: number): Promise<void> {
  await nextTick();
  document.getElementById(`feedback-mark-${number}`)?.focus();
}

function addMarker(box: Box & {kind: 'pin' | 'area'}): void {
  const number = nextNumber++;
  markers.value.push({...box, number, text: ''});
  void focusMarker(number);
}

// Areas keep their size, only the corner moves (and stays inside the screenshot)
function moveMarker(number: number, position: Point): void {
  const marker = markers.value.find((candidate) => candidate.number === number);
  if (marker !== undefined) {
    marker.x = Math.min(position.x, 100 - marker.width);
    marker.y = Math.min(position.y, 100 - marker.height);
  }
}

function removeMarker(number: number): void {
  markers.value = markers.value.filter((marker) => marker.number !== number);
}

function report(): FeedbackReport {
  const sentMarkers = markers.value.filter((marker) => isInsideCrop(marker, crop.value));
  return {
    name: contact.name,
    email: contact.email,
    discord: contact.discord,
    general: general.value,
    markers: sentMarkers.map((marker) => ({kind: marker.kind, number: marker.number, text: marker.text})),
    screenshot: source ? renderReportImage(source, crop.value, sentMarkers, FEEDBACK_LIMITS.requestBytes - TEXT_RESERVE_BYTES) : '',
    diagnostics: diagnostics.value,
  };
}

async function send(): Promise<void> {
  if (state.value !== 'idle' || !hasContent.value) {
    return;
  }
  if (!feedbackConfig.value.serverDelivery) {
    await prepareIssue();
    return;
  }
  state.value = 'sending';
  error.value = undefined;
  saveContact();
  let status: FeedbackResult['status'] | 'network';
  try {
    const response = await fetch(FEEDBACK_PATHS.send, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(report())});
    status = response.ok ? (await response.json() as FeedbackResult).status : 'failed';
  } catch {
    status = 'network';
  }
  if (status !== 'sent') {
    error.value = ERROR_MESSAGES[status];
    state.value = 'idle';
    return;
  }
  state.value = 'sent';
  general.value = '';
  setTimeout(() => {
    if (state.value === 'sent') {
      closeFeedback();
    }
  }, SENT_CLOSE_DELAY_MS);
}

/**
 * GitHub instead of the server: the screenshot into the clipboard right in the click (later the browser no longer
 * allows it), then the prefilled issue to open. The texts stay until the overlay is closed, in case GitHub is left.
 */
async function prepareIssue(): Promise<void> {
  const body = report();
  sentScreenshot.value = body.screenshot;
  const copying = copyScreenshot(body.screenshot);
  issueUrl.value = feedbackIssueUrl(body);
  // Stacked on phones the steps would sit below the screenshot, out of sight
  void nextTick(() => document.querySelector('.feedback-issue')?.scrollIntoView?.({block: 'start'}));
  copied.value = await copying;
}

function onKeydown(event: KeyboardEvent): void {
  if (!feedbackOpen.value && isFeedbackHotkey(event)) {
    event.preventDefault();
    openFeedback();
  } else if (feedbackOpen.value && event.key === 'Escape') {
    close();
  }
}

watch(feedbackOpen, (isOpen) => {
  if (isOpen) {
    start();
  } else {
    releaseImage();
  }
});

onMounted(() => {
  loadContact();
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  releaseImage();
});
</script>
