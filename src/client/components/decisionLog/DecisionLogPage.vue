<template>
  <div class="decision-log" :style="{'--decision-head': headHeight + 'px', '--decision-seats': seats}">
    <header ref="head" class="decision-log__head">
      <div class="decision-log__title">
        <h1 v-i18n>Decision log</h1>
        <span v-if="record !== undefined" class="decision-log__meta">{{ metaText }}</span>
        <a :href="resultLink" class="btn btn-rounded decision-log__back" v-i18n>Back to the result</a>
      </div>
      <template v-if="record !== undefined">
        <div class="decision-log__toolbar">
          <input v-model="query" type="search" class="decision-log__search" :placeholder="$t('Search card or move …')">
          <button v-for="kind in kinds" :key="kind" type="button" class="decision-log__chip" :aria-pressed="shownKinds.has(kind)" @click="toggle(kind)">{{ kindLabel(kind) }}</button>
        </div>
        <div class="decision-log__legend">
          <span><i class="decision-legend-swatch decision-legend-swatch--good"></i><span v-i18n>played the best move of the search, clearly</span></span>
          <span><i class="decision-legend-swatch decision-legend-swatch--close"></i><span v-i18n>played the best move, but within the measuring error</span></span>
          <span><i class="decision-legend-swatch decision-legend-swatch--drop"></i><span v-i18n>played a clearly worse move (rule or trying out)</span></span>
          <span><i class="decision-legend-swatch decision-legend-swatch--single"></i><span v-i18n>only one option</span></span>
          <span v-for="mark in marks" :key="mark"><DecisionMarkIcon :mark="mark" /> <span v-i18n>{{ markTitles[mark] }}</span></span>
          <span v-i18n>± = measuring error of the gap to the best</span>
        </div>
        <!-- Kind of move: each has its own block background, so they can be told apart while scrolling -->
        <div class="decision-log__legend">
          <span v-for="category in categories" :key="category" :class="'decision-legend-move decision-move--' + category" v-i18n>{{ categoryLabels[category] }}</span>
        </div>
        <!-- Lane heads in the sticky head: always above their column -->
        <div class="decision-log__lanes decision-log__lane-heads">
          <div v-for="seat in seatList" :key="seat" :class="'decision-lane-head decision-seat-' + seat">
            <span>{{ laneName(seat) }}</span>
            <small>{{ translateTextWithParams('${0} points', [String(record.scores[seat])]) }}</small>
          </div>
        </div>
      </template>
    </header>
    <p v-if="state === 'loading'" class="decision-log__note" v-i18n>Loading…</p>
    <p v-else-if="state === 'forbidden'" class="decision-log__note" v-i18n>Only admins can see the decision log.</p>
    <p v-else-if="state === 'missing'" class="decision-log__note" v-i18n>This game has no decision log.</p>
    <main v-else-if="record !== undefined" class="decision-log__body">
      <!-- One section per generation: its head sticks at the top until the next generation pushes it away -->
      <section v-for="section in sections" :key="section.generation" class="decision-generation">
        <h2 class="decision-generation__head">{{ translateTextWithParams('Generation ${0}', [String(section.generation)]) }}</h2>
        <div class="decision-log__lanes">
          <!-- Every decision is a row of its own: the block stands in its player's column and pushes the next one down -->
          <DecisionBlock v-for="(row, position) in section.rows" :key="row.id" :trace="row.trace" :question="row.question" :after="row.after"
            :style="{gridColumn: row.trace.player + 1, gridRow: position + 1}" />
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {statusCode} from '@/common/http/statusCode';
import {translateTextWithParams} from '@/client/directives/i18n';
import DecisionBlock from '@/client/components/decisionLog/DecisionBlock.vue';
import DecisionMarkIcon, {DECISION_MARK_TITLES, DecisionMark} from '@/client/components/decisionLog/DecisionMarkIcon.vue';
import {DECISION_KINDS, MOVE_CATEGORIES, MOVE_CATEGORY_LABELS, MoveCategory, DecisionRecord, GenerationSection, generationSections, kindLabel, seatName} from '@/client/components/decisionLog/decisionLogModel';

type DataModel = {
  state: 'loading' | 'ready' | 'forbidden' | 'missing',
  record: DecisionRecord | undefined,
  shownKinds: Set<string>,
  query: string,
  headHeight: number,
};

const participantId = () => new URLSearchParams(window.location.search).get('id') ?? '';

export default defineComponent({
  name: 'DecisionLogPage',
  components: {DecisionBlock, DecisionMarkIcon},
  data(): DataModel {
    return {state: 'loading', record: undefined, shownKinds: new Set(DECISION_KINDS), query: '', headHeight: 0};
  },
  computed: {
    kinds(): ReadonlyArray<string> {
      return DECISION_KINDS;
    },
    marks(): ReadonlyArray<DecisionMark> {
      return ['played', 'best', 'rule'];
    },
    categories(): ReadonlyArray<MoveCategory> {
      return MOVE_CATEGORIES;
    },
    categoryLabels(): Record<MoveCategory, string> {
      return MOVE_CATEGORY_LABELS;
    },
    markTitles(): Record<DecisionMark, string> {
      return DECISION_MARK_TITLES;
    },
    seats(): number {
      return this.record?.scores.length ?? 1;
    },
    seatList(): Array<number> {
      return Array.from({length: this.seats}, (_, seat) => seat);
    },
    resultLink(): string {
      return `${paths.THE_END}?id=${encodeURIComponent(participantId())}`;
    },
    metaText(): string {
      const record = this.record as DecisionRecord;
      return translateTextWithParams('${0} points · ${1} generations · ${2} · bot ${3} · ${4} rollouts per option · value = expected point lead at the end (±10 for a win)',
        [record.scores.join(' : '), String(record.generation), record.setup || 'P1', record.botVersion ?? '?', String(record.rollouts ?? '?')]);
    },
    sections(): Array<GenerationSection> {
      return this.record === undefined ? [] : generationSections(this.record, this.shownKinds, this.query);
    },
  },
  async mounted() {
    const response = await fetch(`${paths.API_DECISION_LOG}?id=${encodeURIComponent(participantId())}`).catch(() => undefined);
    if (response?.status === statusCode.forbidden) {
      this.state = 'forbidden';
    } else if (response === undefined || !response.ok) {
      this.state = 'missing';
    } else {
      this.record = await response.json();
      this.state = 'ready';
    }
    // The generation heads stick right below the head, whose height changes with the width
    const head = this.$refs.head as HTMLElement | undefined;
    if (head !== undefined && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.headHeight = head.offsetHeight).observe(head);
    }
  },
  methods: {
    kindLabel,
    translateTextWithParams,
    laneName(seat: number): string {
      return `${seatName(seat)} · ${this.$t(this.record?.corporations[seat] ?? '')}`;
    },
    toggle(kind: string): void {
      const kinds = new Set(this.shownKinds);
      if (kinds.has(kind)) {
        kinds.delete(kind);
      } else {
        kinds.add(kind);
      }
      this.shownKinds = kinds;
    },
  },
});
</script>
