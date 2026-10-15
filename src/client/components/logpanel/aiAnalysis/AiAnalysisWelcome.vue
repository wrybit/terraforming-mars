<template>
  <!-- Analysis game: once per browser, at the end of the first generation – by then the log holds real AI moves to rate -->
  <div v-if="shown" class="ai-analysis-welcome" data-test="ai-analysis-welcome" @click.self="close">
    <div class="ai-analysis-welcome__dialog" role="dialog" aria-modal="true" aria-labelledby="ai-analysis-welcome-title">
      <!-- A drawn log with the rating bar on an AI row: what to look for below -->
      <div class="ai-analysis-welcome__preview" aria-hidden="true">
        <div class="ai-analysis-welcome__log">
          <div class="ai-analysis-welcome__row"><i class="ai-analysis-welcome__dot ai-analysis-welcome__dot--human"></i><b class="ai-analysis-welcome__human" v-i18n>You</b>&nbsp;→ <span class="ai-analysis-welcome__card" v-i18n>Mohole Area</span></div>
          <div class="ai-analysis-welcome__row ai-analysis-welcome__row--hover"><i class="ai-analysis-welcome__dot"></i><b class="ai-analysis-welcome__ai">{{ aiLabel }}</b>&nbsp;→ <span class="ai-analysis-welcome__card" v-i18n>Trees</span>
            <span class="ai-analysis-welcome__bar"><span class="ai-analysis-welcome__bar-label">{{ aiLabel }}:</span><span v-for="rating in ratings" :key="rating" :class="['ai-analysis-welcome__bar-button', {'ai-analysis-welcome__bar-button--picked': rating === 'down'}]">{{ emoji[rating] }}</span></span>
          </div>
          <div class="ai-analysis-welcome__row"><i class="ai-analysis-welcome__dot"></i><b class="ai-analysis-welcome__ai">{{ aiLabel }}</b>&nbsp;→ <span class="ai-analysis-welcome__card" v-i18n>Banker</span><span class="ai-analysis-welcome__rated">{{ emoji.up }}</span></div>
        </div>
      </div>
      <div class="ai-analysis-welcome__content">
        <div class="ai-analysis-welcome__intro">
          <h1 id="ai-analysis-welcome-title" class="ai-analysis-welcome__title" v-i18n>Help the AI get better</h1>
          <p v-i18n>This is an analysis game: you can rate the AI's moves in the log. If you notice a good or a bad move, rate it – it takes seconds and goes straight into its training.</p>
        </div>
        <div class="ai-analysis-welcome__ways">
          <!-- Touch: no hover and no keyboard, a double tap on the row opens the rating -->
          <div class="ai-analysis-welcome__way ai-analysis-welcome__way--touch">
            <span class="ai-analysis-welcome__icon ai-analysis-welcome__tap" aria-hidden="true">☝</span>
            <span><b v-i18n>Double-tap</b> <span v-i18n>an AI entry in the log below</span></span>
          </div>
          <div class="ai-analysis-welcome__way">
            <span class="ai-analysis-welcome__icon ai-analysis-welcome__chips" aria-hidden="true"><span v-for="rating in ratings" :key="rating">{{ emoji[rating] }}</span></span>
            <span><b v-i18n>Rate</b> <span class="ai-analysis-welcome__pointer-text" v-i18n>Hover an AI entry in the log below</span><span class="ai-analysis-welcome__touch-text" v-i18n>Good, bad or check</span></span>
          </div>
          <div class="ai-analysis-welcome__way">
            <span class="ai-analysis-welcome__icon ai-analysis-welcome__pen" aria-hidden="true">✎</span>
            <span><b v-i18n>Comment</b> <span v-i18n>optional: what you would have done instead</span></span>
          </div>
          <div class="ai-analysis-welcome__way ai-analysis-welcome__way--pointer">
            <kbd class="ai-analysis-welcome__icon ai-analysis-welcome__keycap">I</kbd>
            <span><b v-i18n>Key I</b> <span v-i18n>opens the rating of the newest AI move</span></span>
          </div>
        </div>
        <div class="ai-analysis-welcome__actions">
          <button ref="go" type="button" class="btn btn-primary ai-analysis-welcome__go" v-i18n @click="close">Let's go</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, ref, watch} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {AI_FEEDBACK_EMOJI, AiFeedbackRating} from '@/common/ai/AiFeedback';

const props = defineProps<{
  playerView: PlayerViewModel | undefined;
}>();

// Shown once per browser, like the feedback welcome
const SEEN_KEY = 'tm-ai-analysis-welcome-seen';

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

// "AI" in every language, like the rating bar in the log (LogAiRateBar.vue)
const aiLabel = 'AI';
const emoji = AI_FEEDBACK_EMOJI;
const ratings: ReadonlyArray<AiFeedbackRating> = ['up', 'down', 'flag'];
const dismissed = ref(alreadySeen());
const go = ref<HTMLButtonElement>();

// End of the first generation: from generation 2 on the log has real AI moves – at the start the game itself needs the attention
const shown = computed(() => !dismissed.value && props.playerView?.game.gameOptions.aiAnalysis === true &&
  props.playerView.game.generation >= 2);

function close(): void {
  dismissed.value = true;
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Without storage it shows again on the next page load – better than not at all
  }
}

watch(shown, (isShown) => {
  if (isShown) {
    void nextTick(() => go.value?.focus());
  }
}, {immediate: true});
</script>
