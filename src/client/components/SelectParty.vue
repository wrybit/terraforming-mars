<template>
  <div class="wf-component wf-component--select-party select-party">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- Sending a delegate: where it comes from (lobby free / reserve 5 M€, as the server offers it),
         the parties as tiles with policy and bonus, and below what the delegate changes.
         The board switches to the Turmoil tab and outlines the picked party. -->
    <div v-if="turmoil !== undefined" class="select-party__layout">
      <div v-if="source !== undefined" class="select-party__column select-party__column--source">
        <div class="select-party__label">{{ $t('From where?') }}</div>
        <div class="select-party__source">
          <b>{{ $t(source === 'lobby' ? 'Lobby' : 'Reserve') }}</b>
          <span class="select-party__figures">
            <span v-if="source === 'reserve'" class="turmoil-board-tab__cost">5</span>
            <img :src="figureImage(playerView.thisPlayer.color)" width="30" :height="30 * 1.3" alt="">
          </span>
          <small>{{ $t(source === 'lobby' ? 'free · 1×/gen.' : '5 M€ per delegate') }}</small>
        </div>
      </div>
      <div class="select-party__column select-party__column--parties">
        <div class="select-party__label">{{ $t('To which party?') }}</div>
        <div class="select-party__cards">
          <label v-for="party in turmoil.parties" :key="party.name"
            :class="['select-party__card', {'select-party__card--on': party.name === selectedParty, 'select-party__card--off': !partyAvailableToSelect(party.name)}]"
            :style="{'--party': PARTY_COLOR[party.name]}"
            :data-test="'party-' + party.name">
            <input type="radio" class="choice-option-input" v-model="selectedParty" :value="party.name" :disabled="!partyAvailableToSelect(party.name)" @change="preview()">
            <span class="select-party__badge"><span class="select-party__hex"><img :src="partyImage(party.name)" alt=""></span></span>
            <span v-if="isDominant(party.name)" class="select-party__dominance" :title="$t('Dominant')"></span>
            <span class="select-party__name">{{ $t(party.name) }}</span>
            <span class="select-party__leader" :title="$t('Party leader')">
              <img v-if="party.partyLeader !== undefined" :src="figureImage(party.partyLeader)" width="26" :height="26 * 1.3" alt="">
              <span v-else class="select-party__seat" :style="{backgroundImage: 'url(' + figureImage(undefined) + ')'}"></span>
            </span>
            <span class="select-party__seats">
              <img v-for="(color, index) in seated(party)" :key="index" :src="figureImage(color)" width="18" :height="18 * 1.3" alt="">
            </span>
            <span class="select-party__rule select-party__rule--policy"><small>{{ $t('While ruling') }}</small>{{ $t(agendaText(agenda(party.name).policy)) }}</span>
            <span class="select-party__rule select-party__rule--bonus"><small>{{ $t('When taking over') }}</small>{{ $t(agendaText(agenda(party.name).bonus)) }}</span>
            <span v-if="party.name === turmoil.ruling" class="select-party__ruling">{{ $t('Ruling') }}</span>
          </label>
        </div>
        <div class="select-party__preview" :style="selectedParty !== undefined ? {'--party': PARTY_COLOR[selectedParty]} : {}">
          <template v-if="forecastText !== undefined"><b>{{ $t('Then') }}:</b> {{ forecastText }}</template>
          <template v-else>{{ $t('Pick a party …') }}</template>
        </div>
      </div>
    </div>
    <TabPanelFooterSlot>
    <div v-if="showsave === true" class="nofloat">
        <AppButton @click="saveData" :title="playerinput.buttonLabel" type="submit" size="normal" :disabled="selectedParty === undefined"/>
    </div>
    </TabPanelFooterSlot>
  </div>
</template>
<script lang="ts">
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {SelectPartyModel} from '@/common/models/PlayerInputModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {SelectPartyResponse} from '@/common/inputs/InputResponse';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {PartyModel, TurmoilModel} from '@/common/models/TurmoilModel';
import {Color} from '@/common/Color';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {BoardTabId} from '@/client/components/boardTabs/boardTabs';
import {boardTabState, selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import {PARTY_COLOR, PartyAgenda, agendaText, delegateForecast, figureImage, partyAgenda, partyImage, seatedDelegates, turmoilPickState} from '@/client/components/turmoil/turmoilView';

type DataModel = {
  selectedParty: PartyName | undefined;
  previousBoard: BoardTabId;
};

export default defineComponent({
  name: 'SelectParty',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectPartyModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectPartyResponse) => void,
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
      selectedParty: undefined,
      previousBoard: boardTabState.active,
    };
  },
  components: {
    TabPanelFooterSlot,
    AppButton,
  },
  mounted() {
    if (this.turmoil !== undefined) {
      selectBoardTab('turmoil');
    }
  },
  beforeUnmount() {
    turmoilPickState.pick = undefined;
    if (boardTabState.active === 'turmoil') {
      selectBoardTab(this.previousBoard);
    }
  },
  methods: {
    partyImage,
    figureImage,
    agendaText,
    agenda(party: PartyName): PartyAgenda {
      return this.turmoil === undefined ? {policy: undefined, bonus: undefined} : partyAgenda(this.turmoil, party);
    },
    seated(party: PartyModel): Array<Color> {
      return seatedDelegates(party);
    },
    preview() {
      turmoilPickState.pick = this.selectedParty;
    },
    saveData() {
      if (this.selectedParty === undefined) {
        return;
      }
      this.onsave({type: 'party', partyName: this.selectedParty});
    },
    isDominant(partyName: PartyName): boolean {
      return partyName === this.turmoil?.dominant;
    },
    partyAvailableToSelect(partyName: PartyName): boolean {
      return this.playerinput.parties?.includes(partyName) ?? false;
    },
  },
  computed: {
    PARTY_COLOR(): typeof PARTY_COLOR {
      return PARTY_COLOR;
    },
    turmoil(): TurmoilModel | undefined {
      return this.playerView.game?.turmoil;
    },
    // The server names the source in the title: "(from lobby)" is free, otherwise the delegate costs 5 M€
    source(): 'lobby' | 'reserve' | undefined {
      const title = typeof this.playerinput.title === 'string' ? this.playerinput.title : this.playerinput.title.message;
      if (title.includes('lobby')) {
        return 'lobby';
      }
      return title.includes('M€') ? 'reserve' : undefined;
    },
    forecastText(): string | undefined {
      if (this.selectedParty === undefined || this.turmoil === undefined) {
        return undefined;
      }
      const color = this.playerView.thisPlayer.color;
      const forecast = delegateForecast(this.turmoil, this.selectedParty, color);
      const changes: Array<string> = [];
      if (forecast.becomesDominant) {
        changes.push(translateText('party becomes dominant'));
      }
      if (forecast.becomesLeader) {
        changes.push(translateText('you become party leader'));
      }
      if (forecast.influenceGain > 0) {
        changes.push(translateTextWithParams('influence ${0} (+${1})', [String(this.playerView.thisPlayer.influence + forecast.influenceGain), String(forecast.influenceGain)]));
      }
      return changes.length > 0 ? changes.join(' · ') : translateText('no change in leader or dominance');
    },
  },
});
</script>
