<template>
  <div class="log-filter" data-test="log-filter">
    <!-- Filter of the log: one line with a search field that holds the active filters as chips;
         the button opens all options as a second line (they wrap in whole groups when narrow) -->
    <div class="log-filter-bar">
      <div class="log-filter-field" @click="focusInput">
        <span v-for="(option, index) in modelValue.options" :key="optionKey(option)" :class="chipClasses(option)" :title="optionTitle(option)">
          <template v-if="option.group === 'player'">{{ playerName(option.value) }}</template>
          <template v-else-if="option.group === 'me'">{{ $t('Affects me') }}</template>
          <LogFilterSymbol v-else :option="option"/>
          <button type="button" class="log-filter-chip-remove" :aria-label="$t('Remove')" @click.stop="removeAt(index)">×</button>
        </span>
        <input ref="input" class="log-filter-input" type="search" :value="text" :placeholder="$t('Search or filter …')" :aria-label="$t('Search or filter …')"
          @input="textChanged" @keydown="keyDown">
      </div>
      <button type="button" :class="['log-filter-toggle', {'log-filter-toggle--open': open}]" :aria-expanded="open" :title="$t('Filter')" @click="open = !open">
        <svg class="log-filter-toggle-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>
        <span class="log-filter-toggle-text">{{ $t('Filter') }}</span>
        <span class="log-filter-toggle-caret" aria-hidden="true">▾</span>
      </button>
    </div>
    <div v-if="open" class="log-filter-panel">
      <span v-for="(group, groupIndex) in optionGroups" :key="groupIndex" class="log-filter-group">
        <button v-for="option in group" :key="optionKey(option)" type="button" :class="optionClasses(option)" :title="optionTitle(option)"
          :aria-pressed="isSelected(option)" @click="toggle(option)">
          <template v-if="option.group === 'player'">{{ initial(option.value) }}</template>
          <template v-else-if="option.group === 'me'">{{ $t('Me') }}</template>
          <LogFilterSymbol v-else :option="option"/>
        </button>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {LOG_FILTER_ICONS, LOG_FILTER_KINDS, LOG_FILTER_TYPES, LogFilter, LogFilterOption} from '@/client/components/logpanel/logFilter';
import LogFilterSymbol from '@/client/components/logpanel/LogFilterSymbol.vue';

// Tooltip texts of the options (translated keys)
const TITLES: Record<string, string> = {
  'sign:1': 'Gains', 'sign:-1': 'Losses',
  'kind:action': 'Card actions', 'kind:ma': 'Milestones & Awards', 'kind:project': 'Standard projects',
  'type:active': 'Active cards', 'type:event': 'Event cards', 'type:automated': 'Automated cards',
  'icon:megacredit': 'M€', 'icon:plant': 'Plants', 'icon:steel': 'Steel', 'icon:titanium': 'Titanium', 'icon:power': 'Energy',
  'icon:heat': 'Heat', 'icon:animal': 'Animals', 'icon:microbe': 'Microbes', 'icon:card': 'Cards', 'icon:tr': 'TR',
  'icon:city': 'City', 'icon:greenery': 'Greenery', 'icon:ocean': 'Ocean', 'icon:special': 'Special tile',
};

export default defineComponent({
  name: 'LogFilterBar',
  components: {LogFilterSymbol},
  props: {
    modelValue: {
      type: Object as PropType<LogFilter>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    // Viewing player; spectators have no "me" option
    me: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      open: false,
      // Typed text as entered (the filter keeps it in lower case)
      text: '',
    };
  },
  computed: {
    optionGroups(): Array<Array<LogFilterOption>> {
      const names: Array<LogFilterOption> = this.players.map((player) => ({group: 'player', value: player.color}));
      if (this.me !== undefined) {
        names.push({group: 'me', value: 'me'});
      }
      return [
        names,
        [{group: 'sign', value: '1'}, {group: 'sign', value: '-1'}],
        [...LOG_FILTER_KINDS.map((value): LogFilterOption => ({group: 'kind', value})), ...LOG_FILTER_TYPES.map((value): LogFilterOption => ({group: 'type', value}))],
        LOG_FILTER_ICONS.map((value): LogFilterOption => ({group: 'icon', value})),
      ];
    },
  },
  methods: {
    optionKey(option: LogFilterOption): string {
      return option.group + ':' + option.value;
    },
    isSelected(option: LogFilterOption): boolean {
      return this.modelValue.options.some((selected) => this.optionKey(selected) === this.optionKey(option));
    },
    playerName(color: string): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
    initial(color: string): string {
      return this.playerName(color).charAt(0).toUpperCase();
    },
    optionTitle(option: LogFilterOption): string {
      if (option.group === 'player') {
        return this.playerName(option.value);
      }
      if (option.group === 'me') {
        return this.$t('Affects me');
      }
      return this.$t(TITLES[this.optionKey(option)] ?? option.value);
    },
    optionClasses(option: LogFilterOption): Array<string | Record<string, boolean>> {
      const base = option.group === 'player' ? ['log-filter-option', 'log-filter-option--player', 'player_bg_color_' + option.value] :
        option.group === 'me' ? ['log-filter-option', 'log-filter-option--me'] : ['log-filter-option'];
      return [...base, {'log-filter-option--on': this.isSelected(option)}];
    },
    chipClasses(option: LogFilterOption): Array<string> {
      const classes = ['log-filter-chip', 'log-filter-chip--' + option.group];
      if (option.group === 'player') {
        classes.push('player_bg_color_' + option.value);
      }
      if (option.group === 'sign') {
        classes.push(option.value === '1' ? 'log-filter-chip--gain' : 'log-filter-chip--loss');
      }
      return classes;
    },
    emitFilter(options: ReadonlyArray<LogFilterOption>, text: string): void {
      this.$emit('update:modelValue', {options, text: text.trim().toLowerCase()});
    },
    toggle(option: LogFilterOption): void {
      const options = this.isSelected(option) ?
        this.modelValue.options.filter((selected) => this.optionKey(selected) !== this.optionKey(option)) :
        [...this.modelValue.options, option];
      this.emitFilter(options, this.text);
    },
    removeAt(index: number): void {
      this.emitFilter(this.modelValue.options.filter((_, position) => position !== index), this.text);
    },
    textChanged(event: Event): void {
      this.text = (event.target as HTMLInputElement).value;
      this.emitFilter(this.modelValue.options, this.text);
    },
    // Backspace in the empty field removes the last chip
    keyDown(event: KeyboardEvent): void {
      if (event.key === 'Backspace' && this.text === '' && this.modelValue.options.length > 0) {
        this.removeAt(this.modelValue.options.length - 1);
      }
    },
    focusInput(): void {
      (this.$refs.input as HTMLInputElement | undefined)?.focus();
    },
  },
});
</script>
