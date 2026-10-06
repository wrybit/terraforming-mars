<template>
  <div class="wf-component wf-component--select-party select-party">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- Sending a delegate: where it comes from (lobby free / reserve 5 M€, as the server offers it),
         the parties as tiles with policy and bonus, and below what the delegate changes.
         The board switches to the Turmoil tab and outlines the picked party. -->
    <div v-if="turmoil !== undefined" class="select-party__layout">
      <div v-if="source !== undefined" class="select-party__column select-party__column--source">
        <div class="select-party__label">{{ $t('From where?') }}</div>
        <!-- Both sources like on the board: the one of this action active, the other one shown dimmed
             (the server offers lobby and reserve as separate actions) -->
        <div v-for="kind in SOURCES" :key="kind" :class="['select-party__source', {'select-party__source--on': kind === source, 'select-party__source--off': kind !== source}]">
          <b>{{ $t(kind === 'lobby' ? 'Lobby' : 'Reserve') }}</b>
          <span class="select-party__figures">
            <span v-if="kind === 'reserve'" class="turmoil-board-tab__cost">5</span>
            <img v-for="index in figureCount(kind)" :key="index" :src="figureImage(playerView.thisPlayer.color)" :width="kind === 'lobby' ? 30 : 18" :height="(kind === 'lobby' ? 30 : 18) * 1.3" alt="">
          </span>
          <small>{{ $t(kind === 'lobby' ? 'free · 1×/gen.' : '5 M€ per delegate') }}</small>
        </div>
      </div>
      <div class="select-party__column select-party__column--parties">
        <div class="select-party__label">{{ $t('To which party?') }}</div>
        <div class="select-party__cards">
          <PartyCard v-for="party in turmoil.parties" :key="party.name"
            :party="party"
            :turmoil="turmoil"
            :selected="party.name === selectedParty"
            :disabled="!partyAvailableToSelect(party.name)"
            @select="pick(party.name)"/>
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
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {PARTY_COLOR, delegateForecast, figureImage, turmoilPickState} from '@/client/components/turmoil/turmoilView';
import {focusTurmoilBoard} from '@/client/components/turmoil/turmoilFocus';
import PartyCard from '@/client/components/turmoil/PartyCard.vue';

type DataModel = {
  selectedParty: PartyName | undefined;
  // Brings back the board tab shown before the choice (turmoilFocus.ts)
  restoreBoard: (() => void) | undefined;
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
      restoreBoard: undefined,
    };
  },
  components: {
    TabPanelFooterSlot,
    AppButton,
    PartyCard,
  },
  mounted() {
    if (this.turmoil !== undefined) {
      this.restoreBoard = focusTurmoilBoard();
    }
  },
  beforeUnmount() {
    this.restoreBoard?.();
    turmoilPickState.pick = undefined;
  },
  methods: {
    figureImage,
    // Own figures shown on a source tile: one in the lobby, up to five from the reserve
    figureCount(kind: 'lobby' | 'reserve'): number {
      const color = this.playerView.thisPlayer.color;
      if (kind === 'lobby') {
        return this.turmoil?.lobby.includes(color) ? 1 : 0;
      }
      return Math.min(5, this.turmoil?.reserve.find((delegate) => delegate.color === color)?.number ?? 0);
    },
    pick(party: PartyName) {
      this.selectedParty = party;
      turmoilPickState.pick = party;
    },
    saveData() {
      if (this.selectedParty === undefined) {
        return;
      }
      this.onsave({type: 'party', partyName: this.selectedParty});
    },
    partyAvailableToSelect(partyName: PartyName): boolean {
      return this.playerinput.parties?.includes(partyName) ?? false;
    },
  },
  computed: {
    SOURCES(): ReadonlyArray<'lobby' | 'reserve'> {
      return ['lobby', 'reserve'];
    },
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
