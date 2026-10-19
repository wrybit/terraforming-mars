<template>
  <!-- Smuggling tab of the action menu (Jens, 19 Oct 2026): the suspicion track with every player's marker on top,
       then the two moves as a switch – smuggle (the trade) or bribe (the price as before → after). At the top of the
       track only the bribe is left. The footer button belongs to the chosen move. -->
  <div class="smuggle-input" data-test="smuggle-input">
    <SmugglingPanel v-if="smuggling !== undefined" :smuggling="smuggling" :players="playerView.players" :compact="true"/>

    <!-- The chosen move in its own box; the switch sits on its top edge, so box and switch read as one (Jens, 19 Oct 2026).
         A move that is not possible can still be chosen: the box then says why, instead of a line under the switch. -->
    <section :class="['smuggle-input__move', {'smuggle-input__move--closed': indexOf(chosen) === -1}]">
      <div class="smuggle-input__modes" role="radiogroup">
        <button v-for="mode in MODES" :key="mode.id" type="button" role="radio"
          :class="['smuggle-input__mode', {'smuggle-input__mode--on': mode.id === chosen, 'smuggle-input__mode--blocked': indexOf(mode.id) === -1}]"
          :aria-checked="mode.id === chosen" @click="chosen = mode.id">
          {{ $t(mode.label) }}
          <!-- The bribe carries its price as a Solari coin -->
          <span v-if="mode.id === 'bribe' && ownBribeCost !== undefined" class="smuggle-input__coin">
            <img :src="COIN_ICON" alt=""><b>{{ ownBribeCost }}</b>
          </span>
        </button>
      </div>

      <!-- Both moves stacked in the same place, only the chosen one visible: the box keeps the height of the larger one,
           so switching does not make the rules below jump (Jens, 19 Oct 2026) -->
      <div class="smuggle-input__stage">
        <div v-for="mode in MODES" :key="mode.id"
          :class="['smuggle-input__pane', {'smuggle-input__pane--hidden': mode.id !== chosen}]" :aria-hidden="mode.id !== chosen">
          <div v-if="closedReason(mode.id) !== undefined" class="smuggle-input__closed" data-test="smuggle-closed">
            <span>{{ closedReason(mode.id) }}</span>
          </div>

          <SelectTrade v-else-if="mode.id === 'smuggle' && tradeInput !== undefined" ref="trade"
            :playerView="playerView" :playerinput="tradeInput" :onsave="answer('smuggle')" :showsave="false" :showtitle="false"/>

          <template v-else-if="mode.id === 'bribe' && bribeInput !== undefined">
            <!-- Paid in Solari: what goes and what the suspicion becomes, like any other conversion -->
            <div v-if="paysInSolari" class="smuggle-input__bribe" data-test="smuggle-bribe">
              <AmountSideTile :side="SOLARI" :before="solari" :after="solari - bribeInput.amount" :change="bribeInput.amount" direction="loss"/>
              <AmountSideTile :side="suspicionSide" :before="ownSuspicion" :after="ownSuspicion - 1" :change="1" direction="loss"/>
            </div>
            <!-- Other means of payment (heat for Helion …): the usual payment form -->
            <SelectPayment v-else ref="payment" :playerView="playerView" :playerinput="bribeInput"
              :onsave="answer('bribe')" :showsave="false" :showtitle="false"/>
          </template>
        </div>
      </div>
    </section>

    <!-- The rules as a short list below everything, like on the other Dune tabs -->
    <DuneRuleCards class="smuggle-input__rules" :rules="SMUGGLING_RULES"/>

    <TabPanelFooterSlot v-if="showsave">
      <div class="amount-select__actions">
        <AppButton hotkey="proceed" type="submit" :title="$t(chosen === 'smuggle' ? 'Smuggle' : 'Bribe')"
          :disabled="indexOf(chosen) === -1" @click="saveData"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import SelectTrade from '@/client/components/SelectTrade.vue';
import SelectPayment from '@/client/components/SelectPayment.vue';
import AmountSideTile from '@/client/components/amount/AmountSideTile.vue';
import {AmountSide} from '@/client/components/amount/amountConversion';
import SmugglingPanel from './SmugglingPanel.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import {SMUGGLING_RULES} from './duneRules';
import {duneGraphic} from './duneGraphic';
import {OrOptionsModel, PlayerInputModel, SelectPaymentModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {MAX_SUSPICION, SmugglingModel} from '@/common/dune/DuneModel';
import {Payment} from '@/common/inputs/Payment';
import {Resource} from '@/common/Resource';
import {translateText} from '@/client/directives/i18n';

type Mode = 'smuggle' | 'bribe';

const MODES: ReadonlyArray<{id: Mode, label: string}> = [
  {id: 'smuggle', label: 'Smuggle'},
  {id: 'bribe', label: 'Bribe'},
];

// Input type behind each move in the server's choice (server/dune/Smuggling.ts smugglingTabActions)
const MODE_TYPE: Readonly<Record<Mode, PlayerInputModel['type']>> = {smuggle: 'trade', bribe: 'payment'};

const SOLARI: AmountSide = {kind: 'stock', resource: Resource.MEGACREDITS, perStep: 1};

export default defineComponent({
  name: 'SmuggleInput',
  components: {AppButton, TabPanelFooterSlot, SelectTrade, SelectPayment, AmountSideTile, SmugglingPanel, DuneRuleCards},
  props: {
    playerView: {
      type: Object as PropType<PlayerViewModel>,
      required: true,
    },
    playerinput: {
      type: Object as PropType<OrOptionsModel>,
      required: true,
    },
    onsave: {
      type: Function as PropType<(out: OrOptionsResponse) => void>,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: true,
    },
    showtitle: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    // Smuggling first when it is possible, otherwise the bribe
    const canSmuggle = this.playerinput.options.some((option) => option.type === 'trade');
    return {chosen: (canSmuggle ? 'smuggle' : 'bribe') as Mode};
  },
  computed: {
    MODES(): typeof MODES {
      return MODES;
    },
    SOLARI(): AmountSide {
      return SOLARI;
    },
    SMUGGLING_RULES(): typeof SMUGGLING_RULES {
      return SMUGGLING_RULES;
    },
    smuggling(): SmugglingModel | undefined {
      return this.playerView.game.dune?.smuggling;
    },
    ownSuspicion(): number {
      return this.smuggling?.suspicion.find((entry) => entry.color === this.playerView.thisPlayer.color)?.level ?? 0;
    },
    suspicionSide(): AmountSide {
      return {kind: 'figure', label: 'Suspicion', icon: duneGraphic('special-smugglers-market'), perStep: 1, before: this.ownSuspicion};
    },
    tradeInput(): SelectTradeModel | undefined {
      return this.playerinput.options.find((option): option is SelectTradeModel => option.type === 'trade');
    },
    bribeInput(): SelectPaymentModel | undefined {
      return this.playerinput.options.find((option): option is SelectPaymentModel => option.type === 'payment');
    },
    solari(): number {
      return this.playerView.thisPlayer.megacredits;
    },
    paysInSolari(): boolean {
      return this.bribeInput !== undefined && this.solari >= this.bribeInput.amount;
    },
    ownBribeCost(): number | undefined {
      return this.smuggling?.suspicion.find((entry) => entry.color === this.playerView.thisPlayer.color)?.bribeCost;
    },
    COIN_ICON(): string {
      return duneGraphic('coin');
    },
  },
  methods: {
    // Why a move is not possible, shown inside the box; for the bribe with what is missing (Jens, 19 Oct 2026)
    closedReason(mode: Mode): string | undefined {
      if (this.indexOf(mode) !== -1) {
        return undefined;
      }
      if (mode === 'smuggle') {
        return translateText(this.ownSuspicion >= MAX_SUSPICION ? 'Suspicion 4: smuggling is closed until a bribe lowers it' : 'Nothing worth trading');
      }
      if (this.ownSuspicion < 1) {
        return translateText('No suspicion: nothing to bribe');
      }
      return this.ownBribeCost === undefined ? undefined : translateText('Too few M€ to bribe: it costs ${0}, you have ${1}')
        .replace('${0}', String(this.ownBribeCost)).replace('${1}', String(this.solari));
    },
    indexOf(mode: Mode): number {
      return this.playerinput.options.findIndex((option) => option.type === MODE_TYPE[mode]);
    },
    answer(mode: Mode): (response: InputResponse) => void {
      return (response) => this.onsave({type: 'or', index: this.indexOf(mode), response});
    },
    // The forms sit inside the v-for of the panes, so Vue hands their refs over as arrays
    formRef(name: 'trade' | 'payment'): {saveData: () => void} | undefined {
      const ref = this.$refs[name] as {saveData: () => void} | Array<{saveData: () => void}> | undefined;
      return Array.isArray(ref) ? ref[0] : ref;
    },
    saveData(): void {
      if (this.chosen === 'smuggle') {
        this.formRef('trade')?.saveData();
      } else if (this.paysInSolari && this.bribeInput !== undefined) {
        this.answer('bribe')({type: 'payment', payment: Payment.of({megacredits: this.bribeInput.amount})});
      } else {
        this.formRef('payment')?.saveData();
      }
    },
  },
});
</script>
