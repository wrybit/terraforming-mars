<template>
  <div class="wf-component wf-component--select-card choice-block" :style="choiceBlockStyle(colonies.length)">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- Each colony as a choice tile: planet, free colony slots and what it gives; the board's Colonies tab
         previews the pick (own cube on the next free slot when building) -->
    <label v-for="colony in colonies" :key="colony.model.name"
      :class="['choice-option', 'colony-choice', {'choice-option--selected': selectedColony === colony.model.name}]"
      :data-test="'colony-choice-' + colony.model.name">
      <input type="radio" class="choice-option-input" v-model="selectedColony" :value="colony.model.name" @change="preview()">
      <ColonyPlanet class="colony-choice__planet" :name="colony.model.name"/>
      <b class="colony-choice__name">{{ $t(colony.model.name) }}</b>
      <span class="colony-choice__slots">
        <template v-for="slot in 3" :key="slot">
          <PlayerCube v-if="colony.model.colonies[slot - 1] !== undefined" :color="colony.model.colonies[slot - 1]" view="slight" :size="11"/>
          <i v-else class="colony-choice__slot"></i>
        </template>
      </span>
      <small v-if="mode === 'build'" class="colony-choice__gain">{{ $t(colony.metadata.build.description) }}</small>
      <span v-else class="colony-choice__trade">+{{ colony.tradeValue }}<img :src="'assets/' + colony.tradeIcon.src" alt=""></span>
    </label>
    <TabPanelFooterSlot>
    <div v-if="showsave === true" class="nofloat">
      <AppButton @click="saveData" :title="playerinput.buttonLabel" type="submit" size="normal" :disabled="!canSave()"/>
    </div>
    </TabPanelFooterSlot>
  </div>
</template>
<script lang="ts">
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {defineComponent} from 'vue';
import ColonyPlanet from '@/client/components/colonies/ColonyPlanet.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {ColonyView, colonyView} from '@/client/components/colonies/colonyView';
import {ColonyPreviewMode, setColonyPreview} from '@/client/components/colonies/colonyTradeState';
import {selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {choiceBlockStyle} from '@/client/components/choiceBlock';
import AppButton from '@/client/components/common/AppButton.vue';
import {SelectColonyModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectColonyResponse} from '@/common/inputs/InputResponse';
import {ColonyName} from '@/common/colonies/ColonyName';

type DataModel = {
  selectedColony: ColonyName | undefined,
};

export default defineComponent({
  name: 'SelectColony',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectColonyModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectColonyResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): DataModel {
    return {
      selectedColony: undefined,
    };
  },
  components: {
    TabPanelFooterSlot,
    ColonyPlanet,
    PlayerCube,
    AppButton,
  },
  computed: {
    colonies(): Array<ColonyView> {
      return (this.playerinput.coloniesModel ?? []).map(colonyView);
    },
    // Building shows the build bonus and previews the own cube; trading-like choices show the trade value
    mode(): ColonyPreviewMode {
      return this.playerinput.buttonLabel === 'Build' ? 'build' : 'trade';
    },
  },
  mounted() {
    // Only colonies already in the game are on the board (not those still to be added)
    if ((this.playerView.game?.colonies ?? []).some((colony) => this.playerinput.coloniesModel?.some((choice) => choice.name === colony.name))) {
      selectBoardTab('colonies');
    }
  },
  beforeUnmount() {
    setColonyPreview(undefined);
  },
  methods: {
    choiceBlockStyle,
    preview() {
      setColonyPreview(this.mode, this.selectedColony);
    },
    canSave() {
      return this.selectedColony !== undefined;
    },
    saveData() {
      if (this.selectedColony !== undefined) {
        this.onsave({type: 'colony', colonyName: this.selectedColony});
      }
    },
  },
});
</script>
