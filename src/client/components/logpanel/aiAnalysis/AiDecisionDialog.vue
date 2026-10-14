<template>
  <SidebarModal :open="dialog !== undefined" :framed="true" @close="close()">
    <DialogFrame v-if="dialog !== undefined" :title="$t('Rate AI decision')" :width="520" class="ai-decision-dialog" data-test="ai-decision-dialog" @close="close()">
      <template #icon><SeatIcon kind="ai" :size="22"/></template>

      <!-- The row as in the log -->
      <section class="ai-decision-dialog__section">
        <h3 class="ai-decision-dialog__heading">{{ $t(kindTitle) }}</h3>
        <ul class="ai-decision-dialog__lines">
          <LogMessageComponent v-for="(message, index) in dialog.target.messages" :key="index" :message="message" :viewModel="dialog.viewModel"/>
        </ul>
      </section>

      <!-- What the AI weighed: options with the value it gave them, the chosen ones marked -->
      <section v-if="groups.length > 0" class="ai-decision-dialog__section" data-test="ai-decision-options">
        <h3 class="ai-decision-dialog__heading" v-i18n>Options weighed by the AI</h3>
        <div v-for="group in groups" :key="group.title ?? 'all'" class="ai-decision-dialog__group">
          <h4 v-if="group.title !== undefined" class="ai-decision-dialog__group-title" v-i18n>{{ group.title }}</h4>
          <ul class="ai-decision-dialog__options">
            <li v-for="(option, index) in group.options" :key="index"
              :class="['ai-decision-dialog__option', {'ai-decision-dialog__option--chosen': option.chosen === true}]">
              <span class="ai-decision-dialog__check" aria-hidden="true">{{ option.chosen === true ? '✓' : '' }}</span>
              <span class="ai-decision-dialog__label">{{ label(option) }}</span>
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
          </li>
        </ul>
      </section>

      <!-- Own rating: emoji first, then an optional comment -->
      <section v-if="canRate" class="ai-decision-dialog__section">
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
        <textarea v-if="rating !== undefined" ref="comment" v-model="text" class="ai-decision-dialog__comment" data-test="ai-rating-text"
          :maxlength="MAX_AI_FEEDBACK_TEXT" rows="3" :placeholder="$t('Comment (optional)')" @keydown.stop></textarea>
        <p v-if="error !== undefined" class="ai-decision-dialog__error" role="alert">{{ error }}</p>
      </section>

      <template v-if="canRate" #footer>
        <button v-if="ownRating !== undefined" type="button" class="btn btn-tone-danger" data-test="ai-rating-remove" :disabled="saving" @click="save(undefined)" v-i18n>Remove rating</button>
        <button type="button" class="btn btn-tone-success" data-test="ai-rating-save" :disabled="rating === undefined || saving" @click="save(rating)" v-i18n>Save</button>
      </template>
    </DialogFrame>
  </SidebarModal>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';
import SidebarModal from '@/client/components/SidebarModal.vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import SeatIcon from '@/client/components/create/SeatIcon.vue';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import {AI_FEEDBACK_EMOJI, AiFeedbackRating, MAX_AI_FEEDBACK_TEXT} from '@/common/ai/AiFeedback';
import {AiDecisionOption} from '@/common/ai/AiDecisionSummary';
import {isPlayerId} from '@/common/Types';
import {translateText} from '@/client/directives/i18n';
import {aiFeedbackState, closeAiDecision, ratingsOf, saveAiFeedback} from './aiFeedbackState';
import {DECISION_KIND_TITLES, formatValue, optionGroups, optionLabel} from './aiDecisionOptions';
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
const groups = computed(() => dialog.value?.decision === undefined ? [] : optionGroups(dialog.value.decision));
const kindTitle = computed(() => DECISION_KIND_TITLES[dialog.value?.decision?.kind ?? ''] ?? 'AI decision');
const error = computed(() => aiFeedbackState.error);

const rating = ref<AiFeedbackRating | undefined>();
const text = ref('');
const saving = ref(false);
const comment = ref<HTMLTextAreaElement>();

// Each opened row starts from the choice clicked in the hover bar, otherwise from the own saved rating
watch(dialog, (open) => {
  rating.value = open?.rating ?? ownRating.value?.rating;
  text.value = ownRating.value?.text ?? '';
  if (open?.rating !== undefined) {
    nextTick(() => comment.value?.focus());
  }
}, {immediate: true});

function label(option: AiDecisionOption): string {
  return optionLabel(option);
}

function value(amount: number | undefined): string {
  return formatValue(amount);
}

function choose(choice: AiFeedbackRating): void {
  rating.value = choice;
  nextTick(() => comment.value?.focus());
}

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
    await saveAiFeedback(open.viewModel.id, {messageId: open.target.messageId, rating: choice, text: text.value});
    closeAiDecision();
  } catch (failure) {
    aiFeedbackState.error = translateText('The rating could not be saved:') + ' ' + (failure instanceof Error ? failure.message : String(failure));
  } finally {
    saving.value = false;
  }
}
</script>
