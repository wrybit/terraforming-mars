<template>
  <div :class="['wf-options', {'wf-options--tabs': asTabs}]">
    <label v-if="showtitle"><div>{{ $t(playerinput.title) }}</div></label>
    <label v-if="playerinput.warning !== undefined" class="card-warning"><div>({{ $t(playerinput.warning) }})</div></label>

    <!-- Aktionsmenü: Tabs mit Zähler verfügbarer Einträge; leere Tabs sind abgeschwächt, aber anklickbar -->
    <template v-if="asTabs">
      <div class="or-tabs" role="tablist">
        <button v-for="(option, idx) in displayedOptions" :key="idx"
          ref="optionLabels"
          type="button"
          role="tab"
          :aria-selected="selectedIdx === idx"
          :class="['or-tab', {'or-tab--active': selectedIdx === idx, 'or-tab--empty': availableCount(option) === 0}]"
          @click="selectedOption = option">
          <span class="or-tab-title">{{ $t(option.title) }}</span>
          <span v-if="availableCount(option) !== undefined" class="or-tab-count">{{ availableCount(option) }}</span>
        </button>
      </div>
      <div v-if="selectedIdx !== -1" class="or-tab-panel" role="tabpanel">
        <PlayerInputFactory ref="inputfactory" :key="selectedIdx" v-bind="childInputProps(selectedIdx)" />
      </div>
    </template>

    <template v-else>
      <div v-for="(option, idx) in displayedOptions" :key="idx">
        <label class="form-radio" ref="optionLabels">
          <input v-model="selectedOption" type="radio" :name="radioElementName" :value="option" >
          <i class="form-icon" ></i>
          <span>{{ $t(option.title) }}</span>
        </label>
        <div v-if="selectedIdx === idx" style="margin-left: 30px">
          <PlayerInputFactory ref="inputfactory" v-bind="childInputProps(idx)" />
        </div>
      </div>
    </template>

    <div v-if="showsave && selectedOption && !showChildSaveButton(selectedOption)">
      <div :class="['wf-action', {'or-tab-save': asTabs}]" :style="asTabs ? undefined : 'margin: 5px 30px 10px'">
        <AppButton :title="$t(selectedOption.buttonLabel)" type="submit" size="normal" @click="saveData" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent, inject, provide} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {isHTMLElement} from '@/client/utils/vueUtils';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';

let unique = 0;

export default defineComponent({
  name: 'OrOptions',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => OrOptionsModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: OrOptionsResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  components: {
    AppButton,
  },
  setup() {
    const asTabs = inject<boolean>(OR_OPTIONS_AS_TABS, false);
    // Verschachtelte Auswahlen innerhalb dieses Menüs bleiben Radio-Listen
    provide(OR_OPTIONS_AS_TABS, false);
    return {asTabs};
  },
  data() {
    const displayedOptions: Array<PlayerInputModel> = [];
    const originalIndices: Array<number> = [];
    this.playerinput.options.forEach((option, i) => {
      if (option.type === 'card' && option.showOnlyInLearnerMode !== false && !getPreferences().learner_mode) {
        return;
      }
      displayedOptions.push(option);
      originalIndices.push(i);
    });
    const initialIdx = this.playerinput.initialIdx ?? 0;
    // Special case: If the first recommended displayed option is SelectProjectCardToPlay, and none of them are enabled, skip it.
    let selectedIdx = initialIdx;
    if (displayedOptions.length > 1 &&
      displayedOptions[initialIdx].type === 'projectCard' &&
      !displayedOptions[initialIdx].cards.some((card) => card.isDisabled !== true)) {
      selectedIdx = initialIdx + 1;
    }
    return {
      displayedOptions,
      originalIndices,
      radioElementName: 'selectOption' + unique++,
      selectedOption: displayedOptions[selectedIdx],
      selectedIdx,
    };
  },
  watch: {
    selectedOption(newOption: PlayerInputModel) {
      this.selectedIdx = this.displayedOptions.indexOf(newOption);
      // Clicking the option can shift elements on the page.
      // This preserves the location of the option button the user just clicked by
      // tracking where it was on the screen, where it moved, and then repositioning it.
      const anchorTop = this.getSelectedOptionTop();
      this.$nextTick(() => {
        const newTop = this.getSelectedOptionTop();
        if (anchorTop !== undefined && newTop !== undefined) {
          const delta = newTop - anchorTop;
          if (Math.abs(delta) > 0.5) {
            window.scrollBy(0, delta);
          }
        }
      });
    },
  },
  methods: {
    // Anzahl auswählbarer Einträge (Karten, Standardprojekte, Unteroptionen) – undefined, wenn die Option keine Liste hat
    availableCount(option: PlayerInputModel): number | undefined {
      if (option.type === 'projectCard' || option.type === 'card') {
        return option.cards.filter((card) => card.isDisabled !== true).length;
      }
      if (option.type === 'or') {
        return option.options.length;
      }
      return undefined;
    },
    // Gemeinsame Props für den Kind-Input, egal ob Tab- oder Radio-Darstellung
    childInputProps(displayedIdx: number) {
      const option = this.displayedOptions[displayedIdx];
      return {
        playerView: this.playerView,
        playerinput: option,
        onsave: this.playerFactorySaved(displayedIdx),
        showsave: this.showsave && this.showChildSaveButton(option),
        showtitle: false,
      };
    },
    getSelectedOptionTop(): number | undefined {
      const element = this.getSelectedOptionLabelElement();
      return element?.getBoundingClientRect().top;
    },
    getSelectedOptionLabelElement(): HTMLElement | undefined {
      const idx = this.selectedIdx;
      const optionLabels = this.$refs.optionLabels as HTMLElement | HTMLElement[] | undefined;
      if (idx === -1 || !optionLabels) {
        return undefined;
      }

      const val = Array.isArray(optionLabels) ? optionLabels[idx] : optionLabels;
      return isHTMLElement(val) ? val : undefined;
    },
    playerFactorySaved(displayedIdx: number) {
      const idx = this.originalIndices[displayedIdx];
      return (out: InputResponse) => {
        this.onsave({
          type: 'or',
          index: idx,
          response: out,
        });
      };
    },
    // When the child component is a multi-select card, let it render its own save button.
    // This allows the child to control the button label (e.g. "Sell 3 patents").
    showChildSaveButton(option: PlayerInputModel): boolean {
      return option.type === 'card' && !(option.max === 1 && option.min === 1);
    },
    saveData() {
      let ref = this.$refs['inputfactory'] as {saveData: () => void} | Array<{saveData: () => void}>;
      if (Array.isArray(ref)) {
        ref = ref[0];
      }
      ref.saveData();
    },
  },
});

</script>

