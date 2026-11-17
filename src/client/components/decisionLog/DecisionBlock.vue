<template>
  <div :class="['decision-block', 'decision-block--' + rating.tone, 'decision-move--' + category]">
    <div class="decision-block__top">
      <span class="decision-block__kind">
        <!-- Phone: one column, the player is a coloured tag in the block -->
        <span :class="'decision-block__owner decision-seat-' + trace.player">{{ seatName }}</span>
        {{ kindName }}<template v-if="trace.followUp"> · <span v-i18n>follow-up question</span></template>
      </span>
      <span class="decision-block__badges">
        <span :class="'decision-badge decision-badge--' + rating.tone">{{ rating.label }}</span>
        <span v-if="ruleDiffers" class="decision-badge" v-i18n>Rule ≠ search</span>
        <span v-if="(trace.milliseconds ?? 0) > 0" class="decision-badge">{{ `${trace.milliseconds} ms` }}</span>
        <!-- Raw data on request: exactly what the training reads -->
        <button type="button" class="decision-block__raw" :title="$t('Raw data (JSON)')" :aria-pressed="showRaw" @click="showRaw = !showRaw">{ }</button>
      </span>
    </div>
    <div class="decision-block__move">
      <span v-if="playedStripe !== undefined" :class="['decision-stripe', playedStripe]"></span>
      <DecisionMoveText :parts="playedParts" />
      <!-- What the move changes, as the effect chips of the game log -->
      <span class="decision-effects"><LogEffectIcon v-for="(effect, index) in playedEffects" :key="index" :effect="effect" /></span>
    </div>
    <div v-if="question !== ''" class="decision-block__note">{{ $t(question) }}</div>
    <div v-if="rating.tone !== 'single'" class="decision-options">
      <div v-for="option in visibleOptions" :key="option.index" :class="['decision-option', {'decision-option--played': option.index === trace.chosen}]">
        <div class="decision-option__bar">
          <div class="decision-option__fill" :style="{width: option.width}"></div>
          <span class="decision-option__text">
            <DecisionMarkIcon v-if="option.index === trace.chosen" mark="played" />
            <DecisionMarkIcon v-if="option.index === trace.searchBest" mark="best" />
            <DecisionMarkIcon v-if="option.index === trace.rule" mark="rule" />
            <span v-if="option.stripe !== undefined" :class="['decision-stripe', option.stripe]"></span>
            <DecisionMoveText :parts="option.parts" />
          </span>
          <span class="decision-effects"><LogEffectIcon v-for="(effect, index) in option.effects" :key="index" :effect="effect" /></span>
        </div>
        <div class="decision-option__value" :title="option.detail">{{ option.value }}</div>
      </div>
      <div v-if="unsearched > 0" class="decision-block__note">{{ translateTextWithParams('+ ${0} more allowed moves without search (prior only)', [String(unsearched)]) }}</div>
      <button v-if="hiddenCount > 0" type="button" class="decision-block__more" @click="showAll = true">{{ translateTextWithParams('+ ${0} more options', [String(hiddenCount)]) }}</button>
    </div>
    <div v-if="offeredCards.length > 0" class="decision-block__note">
      {{ offeredLabel }}
      <template v-for="(card, position) in offeredCards" :key="card.name + position"><template v-if="position > 0">, </template><AiCardHover :card="card.card" :class="card.taken ? 'decision-block__taken' : 'decision-block__left'">{{ card.name }}</AiCardHover></template>
    </div>
    <div class="decision-block__state">
      <span><span v-i18n>Points</span> <b>{{ player.points }}</b></span>
      <span><span v-i18n>TR</span> <b>{{ player.tr }}</b></span>
      <span><span v-i18n>Megacredits</span> <b>{{ player.stock[0] }} (+{{ player.production[0] }})</b></span>
      <span><span v-i18n>Hand</span> <b>{{ player.hand.length }}</b></span>
      <span><span v-i18n>Played</span> <b>{{ player.played.length }}</b></span>
    </div>
    <pre v-if="showRaw" class="decision-block__json">{{ JSON.stringify(trace, null, 1) }}</pre>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {$t, translateTextWithParams} from '@/client/directives/i18n';
import DecisionMarkIcon from '@/client/components/decisionLog/DecisionMarkIcon.vue';
import DecisionMoveText from '@/client/components/decisionLog/DecisionMoveText.vue';
import AiCardHover from '@/client/components/logpanel/aiAnalysis/AiCardHover.vue';
import LogEffectIcon from '@/client/components/logpanel/LogEffectIcon.vue';
import {LogEffect} from '@/client/components/logpanel/logActions';
import {cardTypeToCss} from '@/client/components/logpanel/logCardType';
import {moveCardType, moveEffects, playedChanges} from '@/client/components/decisionLog/decisionEffects';
import {DecisionPlayer, DecisionRating, DecisionTrace, MoveCategory, MovePart, gapError, kindLabel, moveCategory, moveParts, optionValue, rateDecision, seatName} from '@/client/components/decisionLog/decisionLogModel';

// Colour class of the card type stripe, as in the game log rows
function stripeOf(move: DecisionTrace['candidates'][number]['move'], kind: string): string | undefined {
  const type = moveCardType(move, kind);
  return type === undefined ? undefined : cardTypeToCss[type];
}

// Options shown before "more options": the best ones, the played one always
const SHOWN_OPTIONS = 3;

type OptionRow = {index: number, parts: Array<MovePart>, effects: Array<LogEffect>, stripe: string | undefined, value: string, detail: string, width: string};

export default defineComponent({
  name: 'DecisionBlock',
  components: {DecisionMarkIcon, DecisionMoveText, AiCardHover, LogEffectIcon},
  props: {
    trace: {type: Object as PropType<DecisionTrace>, required: true},
    question: {type: String, default: ''},
    after: {type: Array as PropType<ReadonlyArray<DecisionPlayer>>, default: undefined},
  },
  data() {
    return {showAll: false, showRaw: false};
  },
  computed: {
    rating(): DecisionRating {
      return rateDecision(this.trace);
    },
    player(): DecisionPlayer {
      return this.trace.players[this.trace.player];
    },
    seatName(): string {
      return seatName(this.trace.player);
    },
    kindName(): string {
      return kindLabel(this.trace.kind);
    },
    playedParts(): Array<MovePart> {
      return moveParts(this.trace.candidates[this.trace.chosen].move, this.trace.kind);
    },
    // The real change up to the next decision; card data only at the end of the game
    playedEffects(): Array<LogEffect> {
      const after = this.after?.[this.trace.player];
      return after === undefined ? moveEffects(this.trace.candidates[this.trace.chosen].move, this.trace.kind) : playedChanges(this.trace.candidates[this.trace.chosen].move, this.player, after);
    },
    playedStripe(): string | undefined {
      return stripeOf(this.trace.candidates[this.trace.chosen].move, this.trace.kind);
    },
    category(): MoveCategory {
      return moveCategory(this.trace);
    },
    ruleDiffers(): boolean {
      return this.trace.rule !== null && this.trace.rule !== undefined && this.trace.searchBest !== null && this.trace.searchBest !== undefined && this.trace.rule !== this.trace.searchBest;
    },
    rankedOptions(): Array<OptionRow> {
      const ranked = this.trace.candidates.map((candidate, index) => ({candidate, index, value: optionValue(candidate)}))
        .filter((entry): entry is {candidate: typeof entry.candidate, index: number, value: number} => entry.value !== null)
        .sort((a, b) => b.value - a.value);
      const values = ranked.map((entry) => entry.value);
      const low = Math.min(...values);
      const high = Math.max(...values);
      return ranked.map((entry) => {
        const error = gapError(entry.candidate);
        const rollouts = translateTextWithParams('${0} rollouts', [String(entry.candidate.rollouts)]);
        return {
          index: entry.index,
          parts: moveParts(entry.candidate.move, this.trace.kind),
          effects: entry.index === this.trace.chosen ? this.playedEffects : moveEffects(entry.candidate.move, this.trace.kind),
          stripe: stripeOf(entry.candidate.move, this.trace.kind),
          value: `${entry.value >= 0 ? '+' : ''}${entry.value.toFixed(1)}${error ? ' ±' + error.toFixed(1) : ''}`,
          detail: entry.candidate.adjustment ? `${rollouts}, ${translateTextWithParams('correction ${0}', [String(entry.candidate.adjustment)])}` : rollouts,
          // Relative between the worst and the best option, so small differences are visible
          width: high === low ? '100%' : `${8 + 92 * (entry.value - low) / (high - low)}%`,
        };
      });
    },
    visibleOptions(): Array<OptionRow> {
      return this.showAll ? this.rankedOptions : this.rankedOptions.filter((option, position) => position < SHOWN_OPTIONS || option.index === this.trace.chosen);
    },
    hiddenCount(): number {
      return this.rankedOptions.length - this.visibleOptions.length;
    },
    unsearched(): number {
      return this.trace.candidates.filter((candidate) => candidate.mean === null).length;
    },
    offeredCards(): Array<{card: string, name: string, taken: boolean}> {
      const taken = new Set(this.trace.candidates[this.trace.chosen].move.cards ?? []);
      return (this.trace.offered?.cards ?? []).map((card) => ({card, name: $t(card), taken: taken.has(card)}));
    },
    offeredLabel(): string {
      return $t(this.trace.kind === 'draft' ? 'Offer:' : this.trace.kind === 'research' ? 'For sale:' : 'Cards:');
    },
  },
  methods: {
    translateTextWithParams,
  },
});
</script>
