<template>
  <SidebarModal :open="dialog !== undefined" :framed="true" @close="close()">
    <DialogFrame v-if="dialog !== undefined" :title="$t('Rate AI decision')" :width="700" class="ai-decision-dialog" data-test="ai-decision-dialog" @close="close()">
      <template #icon><SeatIcon kind="ai" :size="22"/></template>

      <!-- The row exactly as the log shows it (log-panel: same row styles as in the log box) -->
      <section class="ai-decision-dialog__section">
        <h3 class="ai-decision-dialog__heading">{{ $t(kindTitle) }}</h3>
        <div class="log-panel ai-decision-dialog__lines">
          <LogActionRow v-if="dialog.target.row.type === 'action'" :row="dialog.target.row" :viewModel="dialog.viewModel"/>
          <LogMessageComponent v-else-if="dialog.target.row.type === 'message'" :message="dialog.target.row.message" :viewModel="dialog.viewModel"/>
        </div>
      </section>

      <!-- Draft, purchase, start: the offered cards themselves, the chosen ones marked -->
      <AiDecisionCards v-if="showsCards && dialog.decision !== undefined" :decision="dialog.decision" :players="dialog.viewModel.players"/>

      <AiDecisionStateFacts v-if="dialog.decision?.state !== undefined" :state="dialog.decision.state" :passed="isPass" :effects="rowEffects"/>

      <!-- What the AI weighed: options with the value it gave them, the chosen ones marked -->
      <section v-if="groups.length > 0" class="ai-decision-dialog__section" data-test="ai-decision-options">
        <h3 class="ai-decision-dialog__heading" v-i18n>Options weighed by the AI</h3>
        <div v-for="group in groups" :key="group.title ?? 'all'" class="ai-decision-dialog__group">
          <h4 v-if="group.title !== undefined" class="ai-decision-dialog__group-title" v-i18n>{{ group.title }}</h4>
          <ul class="ai-decision-dialog__options">
            <li v-for="(option, index) in group.options" :key="index"
              :class="['ai-decision-dialog__option', {'ai-decision-dialog__option--chosen': option.chosen === true}]">
              <span class="ai-decision-dialog__check" aria-hidden="true">{{ option.chosen === true ? '✓' : '' }}</span>
              <AiCardHover :card="optionCard(option)" class="ai-decision-dialog__label">{{ label(option) }}</AiCardHover>
              <span class="ai-decision-dialog__value">{{ value(option.value) }}</span>
            </li>
          </ul>
        </div>
        <p class="ai-decision-dialog__hint" v-i18n>Value in M€ as estimated by the AI (higher is better).</p>
      </section>

      <!-- Ratings of the other players -->
      <section v-if="otherRatings.length > 0" class="ai-decision-dialog__section">
        <h3 class="ai-decision-dialog__heading" v-i18n>Ratings</h3>
        <ul class="ai-decision-dialog__ratings">
          <li v-for="entry in otherRatings" :key="entry.color" class="ai-decision-dialog__rating">
            <span aria-hidden="true">{{ emoji[entry.rating] }}</span>
            <span :class="'log-row-name log-row-name--' + entry.color">{{ entry.name }}</span>
            <span v-if="entry.text !== ''" class="ai-decision-dialog__rating-text">{{ entry.text }}</span>
            <span v-if="entry.betterOptionLabel !== undefined" class="ai-decision-dialog__rating-better">→ {{ betterLabel(entry.betterOptionLabel, entry.betterOptionCard) }}</span>
          </li>
        </ul>
      </section>

      <!-- Own rating: emoji first, then an optional comment -->
      <section v-if="canRate" ref="fullRating" :class="['ai-decision-dialog__section', 'ai-decision-dialog__rating-full', {'ai-decision-dialog__rating-full--shown': !compact}]">
        <h3 class="ai-decision-dialog__heading" v-i18n>Your rating</h3>
        <div class="ai-decision-dialog__choices" role="radiogroup">
          <button v-for="choice in choices" :key="choice.rating" type="button" role="radio"
            :aria-checked="rating === choice.rating" :data-test="'ai-rating-' + choice.rating"
            :class="['ai-decision-dialog__choice', 'ai-decision-dialog__choice--' + choice.rating, {'ai-decision-dialog__choice--selected': rating === choice.rating}]"
            @click="choose(choice.rating)">
            <span class="ai-decision-dialog__choice-emoji" aria-hidden="true">{{ emoji[choice.rating] }}</span>
            <span v-i18n>{{ choice.label }}</span>
          </button>
        </div>
        <!-- Thumbs down / flag: which option would have been better (turns the rating into a training example) -->
        <label v-if="canNameBetterOption(rating) && betterChoices.length > 0" class="ai-decision-dialog__better">
          <span class="ai-decision-dialog__better-label" v-i18n>Better would have been:</span>
          <select v-model="betterIndex" class="ai-decision-dialog__select" data-test="ai-rating-better">
            <option :value="undefined">{{ $t('(no suggestion)') }}</option>
            <option v-for="option in betterChoices" :key="option.index" :value="option.index">{{ label(option) }} ({{ value(option.value) }})</option>
          </select>
        </label>
        <textarea v-if="rating !== undefined" ref="comment" v-model="text" class="ai-decision-dialog__comment" data-test="ai-rating-text"
          :maxlength="MAX_AI_FEEDBACK_TEXT" rows="3" :placeholder="$t('Comment (optional)')" @keydown="keepKeysInField"></textarea>
        <p v-if="error !== undefined" class="ai-decision-dialog__error" role="alert">{{ error }}</p>
      </section>

      <!-- As long as the full rating is out of view: the same rating as one sticky line at the bottom (frosted glass).
           Height 0 in the flow, so showing and hiding it never moves the content (no jumping at the end of the scroll). -->
      <div v-if="canRate" class="ai-decision-dialog__compact-anchor">
        <div :class="['ai-decision-dialog__compact', {'ai-decision-dialog__compact--shown': compact}]" data-test="ai-rating-compact" :aria-hidden="!compact">
          <div class="ai-decision-dialog__compact-choices" role="radiogroup">
            <button v-for="choice in choices" :key="choice.rating" type="button" role="radio" :tabindex="compact ? 0 : -1"
              :aria-checked="rating === choice.rating" :title="$t(choice.label)" :aria-label="$t(choice.label)"
              :class="['ai-decision-dialog__compact-choice', {'ai-decision-dialog__choice--selected': rating === choice.rating}]"
              @click="choose(choice.rating, 'compact')">{{ emoji[choice.rating] }}</button>
          </div>
          <input ref="compactComment" v-model="text" type="text" class="ai-decision-dialog__compact-text" data-test="ai-rating-compact-text"
            :tabindex="compact ? 0 : -1" :maxlength="MAX_AI_FEEDBACK_TEXT" :placeholder="$t('Comment (optional)')" @keydown="keepKeysInField">
        </div>
      </div>

      <template #footer>
        <!-- Step through the AI rows of the log (also arrow keys up/down), bottom left -->
        <div class="ai-decision-dialog__steps">
          <button type="button" class="ai-decision-dialog__step" data-test="ai-decision-previous" :disabled="position <= 0"
            :title="$t('Previous AI decision') + ' (↑)'" :aria-label="$t('Previous AI decision')" @click="step(-1)">↑</button>
          <button type="button" class="ai-decision-dialog__step" data-test="ai-decision-next" :disabled="position < 0 || position >= count - 1"
            :title="$t('Next AI decision') + ' (↓)'" :aria-label="$t('Next AI decision')" @click="step(1)">↓</button>
        </div>
        <button v-if="canRate && ownRating !== undefined" type="button" class="btn btn-tone-danger" data-test="ai-rating-remove" :disabled="saving" @click="save(undefined)" v-i18n>Remove rating</button>
        <button v-if="canRate" type="button" class="btn btn-tone-success" data-test="ai-rating-save" :disabled="rating === undefined || saving" :title="$t('Save') + ' (Ctrl/⌘ + Enter)'" @click="save(rating)" v-i18n>Save</button>
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import LogActionRow from '@/client/components/logpanel/LogActionRow.vue';
import AiDecisionStateFacts from './AiDecisionStateFacts.vue';
import AiDecisionCards from './AiDecisionCards.vue';
import AiCardHover from './AiCardHover.vue';
import {AI_FEEDBACK_EMOJI, AiFeedbackRating, canNameBetterOption, MAX_AI_FEEDBACK_TEXT} from '@/common/ai/AiFeedback';
import {AiDecisionOption} from '@/common/ai/AiDecisionSummary';
import {isPlayerId} from '@/common/Types';
import {translateText} from '@/client/directives/i18n';
import {aiFeedbackState, closeAiDecision, openAiDecisionIndex, ratingsOf, saveAiFeedback, stepAiDecision} from './aiFeedbackState';
import {DECISION_KIND_TITLES, formatValue, optionCard, optionGroups, optionLabel} from './aiDecisionOptions';
import {AI_RATING_CHOICES} from './aiRatingChoices';

// Rating of one AI decision in an analysis game: the row, the options the AI weighed with their
// values, the ratings of the others and the own rating (flag / good / bad plus optional comment).
// Lives in App.vue: the game view remounts on every AI move and would close it while typing.

const emoji = AI_FEEDBACK_EMOJI;
const choices = AI_RATING_CHOICES;

const dialog = computed(() => aiFeedbackState.dialog);
const ownColor = computed(() => dialog.value?.viewModel.thisPlayer?.color);
// Only players rate; spectators read
const canRate = computed(() => dialog.value !== undefined && isPlayerId(dialog.value.viewModel.id) && ownColor.value !== undefined);
const ratings = computed(() => dialog.value === undefined ? [] : ratingsOf(dialog.value.target.messageId));
const ownRating = computed(() => ratings.value.find((entry) => entry.color === ownColor.value));
const otherRatings = computed(() => ratings.value.filter((entry) => entry.color !== ownColor.value));
// The row is the AI passing: the situation then lists what it could still have done
const isPass = computed(() => {
  const row = dialog.value?.target.row;
  return row?.type === 'action' && row.action.kind === 'pass';
});
// Card decisions show the cards as cards (draft, purchase, kept drawn cards, start selection)
const CARD_KINDS = ['draft', 'research', 'keep', 'initial'];
const showsCards = computed(() => {
  const decision = dialog.value?.decision;
  return decision !== undefined && CARD_KINDS.includes(decision.kind) && decision.options.some((option) => option.card !== undefined);
});
const groups = computed(() => dialog.value?.decision === undefined ? [] : optionGroups(dialog.value.decision));
const kindTitle = computed(() => DECISION_KIND_TITLES[dialog.value?.decision?.kind ?? ''] ?? 'AI decision');
const error = computed(() => aiFeedbackState.error);

const rating = ref<AiFeedbackRating | undefined>();
const betterIndex = ref<number | undefined>();
// Options the AI did not take, best first (as in the list above)
const betterChoices = computed(() => groups.value.flatMap((group) => group.options).filter((option) => option.index !== undefined && option.chosen !== true));
const text = ref('');
const saving = ref(false);
const comment = ref<HTMLTextAreaElement>();
const compactComment = ref<HTMLInputElement>();
const fullRating = ref<HTMLElement>();
// The full rating is (largely) out of view: the compact line stands in for it
const compact = ref(false);
let ratingObserver: IntersectionObserver | undefined;

function observeFullRating(element: HTMLElement | undefined): void {
  ratingObserver?.disconnect();
  ratingObserver = undefined;
  compact.value = false;
  const body = element?.closest('.dialog-frame-body');
  if (element === undefined || !(body instanceof HTMLElement) || typeof IntersectionObserver === 'undefined') {
    return;
  }
  // Compact below 40 % visible, full again from 80 %: the gap keeps it from flipping back and forth
  ratingObserver = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < 0.4) {
      compact.value = true;
    } else if (entry.intersectionRatio >= 0.8) {
      compact.value = false;
    }
  }, {root: body, threshold: [0, 0.4, 0.8, 1]});
  ratingObserver.observe(element);
}
watch(fullRating, (element) => observeFullRating(element));
onBeforeUnmount(() => ratingObserver?.disconnect());

// Own effects of the row (production changes …) – the situation shows what the decision changed
const rowEffects = computed(() => {
  const row = dialog.value?.target.row;
  return row?.type === 'action' ? row.action.effects : [];
});

// Each opened row starts from the choice clicked in the hover bar, otherwise from the own saved rating
watch(dialog, (open) => {
  rating.value = open?.rating ?? ownRating.value?.rating;
  text.value = ownRating.value?.text ?? '';
  betterIndex.value = ownRating.value?.betterOptionIndex;
  if (open?.rating !== undefined) {
    nextTick(() => comment.value?.focus());
  }
}, {immediate: true});

function label(option: AiDecisionOption): string {
  return optionLabel(option);
}

function betterLabel(rawLabel: string, card: string | undefined): string {
  return optionLabel({label: rawLabel, card});
}

function value(amount: number | undefined): string {
  return formatValue(amount);
}

function choose(choice: AiFeedbackRating, from: 'full' | 'compact' = 'full'): void {
  rating.value = choice;
  nextTick(() => (from === 'compact' ? compactComment.value : comment.value)?.focus({preventScroll: from === 'compact'}));
}

// Typing must not trigger game shortcuts (I, F, A/S/D …); Escape still closes the dialog
function keepKeysInField(event: KeyboardEvent): void {
  const field = event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement ? event.target : undefined;
  const steps = (event.key === 'ArrowUp' || event.key === 'ArrowDown') && field?.value === '';
  // The one-line field saves with Enter alone
  const saves = event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement);
  if (event.key !== 'Escape' && !steps && !saves) {
    event.stopPropagation();
  }
}

const position = computed(() => dialog.value === undefined ? -1 : openAiDecisionIndex());
const count = computed(() => dialog.value?.targets.length ?? 0);

function step(direction: -1 | 1): void {
  stepAiDecision(direction);
}

// Arrow keys step through the AI rows, unless a field (comment, better option) has the focus
function onKeydown(event: KeyboardEvent): void {
  if (dialog.value === undefined) {
    return;
  }
  // Ctrl/Cmd + Enter saves, also from the comment field
  const compactField = event.target instanceof HTMLInputElement && event.target.type === 'text';
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || compactField) && canRate.value && rating.value !== undefined && !saving.value) {
    event.preventDefault();
    void save(rating.value);
    return;
  }
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
    return;
  }
  // In the comment field the arrows move the cursor once something is typed; an empty field lets them step
  const target = event.target;
  if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && !compactField) ||
    ((target instanceof HTMLTextAreaElement || compactField) && (target as HTMLInputElement).value !== '')) {
    return;
  }
  event.preventDefault();
  step(event.key === 'ArrowUp' ? -1 : 1);
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

function close(): void {
  closeAiDecision();
}

async function save(choice: AiFeedbackRating | undefined): Promise<void> {
  const open = dialog.value;
  if (open === undefined || open.viewModel.id === undefined) {
    return;
  }
  saving.value = true;
  try {
    const betterOptionIndex = canNameBetterOption(choice) ? betterIndex.value : undefined;
    await saveAiFeedback(open.viewModel.id, {messageId: open.target.messageId, rating: choice, text: text.value, betterOptionIndex});
    closeAiDecision();
  } catch (failure) {
    aiFeedbackState.error = translateText('The rating could not be saved:') + ' ' + (failure instanceof Error ? failure.message : String(failure));
  } finally {
    saving.value = false;
  }
}
</script>
