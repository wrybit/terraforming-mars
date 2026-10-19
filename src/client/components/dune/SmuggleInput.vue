<template>
  <!-- Smuggling tab of the action menu (Jens, 19 Oct 2026): the suspicion track with every player's marker on top,
       then the two moves as a switch – smuggle (the trade) or bribe (the price as before → after). At the top of the
       track only the bribe is left. The footer button belongs to the chosen move. -->
  <div class="smuggle-input" data-test="smuggle-input">
    <SmugglingPanel v-if="smuggling !== undefined" :smuggling="smuggling" :players="playerView.players" :compact="true"/>

    <div class="smuggle-input__modes" role="radiogroup">
      <button v-for="mode in MODES" :key="mode.id" type="button" role="radio"
        :class="['smuggle-input__mode', {'smuggle-input__mode--on': mode.id === chosen}]"
        :aria-checked="mode.id === chosen" :disabled="indexOf(mode.id) === -1"
        @click="chosen = mode.id">{{ $t(mode.label) }}</button>
    </div>
    <p v-if="unavailableReason !== undefined" class="smuggle-input__reason">{{ $t(unavailableReason) }}</p>

    <SelectTrade v-if="chosen === 'smuggle' && tradeInput !== undefined" ref="trade" :key="'trade'"
      :playerView="playerView" :playerinput="tradeInput" :onsave="answer('smuggle')" :showsave="false" :showtitle="false"/>

    <template v-if="chosen === 'bribe' && bribeInput !== undefined">
      <!-- Paid in Solari: what goes and what the suspicion becomes, like any other conversion -->
      <div v-if="paysInSolari" class="smuggle-input__bribe" data-test="smuggle-bribe">
        <AmountSideTile :side="SOLARI" :before="solari" :after="solari - bribeInput.amount" :change="bribeInput.amount" direction="loss"/>
        <AmountSideTile :side="suspicionSide" :before="ownSuspicion" :after="ownSuspicion - 1" :change="1" direction="loss"/>
      </div>
      <!-- Other means of payment (heat for Helion …): the usual payment form -->
      <SelectPayment v-else ref="payment" :playerView="playerView" :playerinput="bribeInput"
        :onsave="answer('bribe')" :showsave="false" :showtitle="false"/>
    </template>

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
import {duneGraphic} from './duneGraphic';
import {OrOptionsModel, PlayerInputModel, SelectPaymentModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {MAX_SUSPICION, SmugglingModel} from '@/common/dune/DuneModel';
import {Payment} from '@/common/inputs/Payment';
import {Resource} from '@/common/Resource';

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
  components: {AppButton, TabPanelFooterSlot, SelectTrade, SelectPayment, AmountSideTile, SmugglingPanel},
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
    // Why the other move is greyed out
    unavailableReason(): string | undefined {
      if (this.tradeInput === undefined) {
        return this.ownSuspicion >= MAX_SUSPICION ? 'Suspicion 4: smuggling is closed until a bribe lowers it' : 'Nothing worth trading';
      }
      if (this.bribeInput === undefined) {
        return 'Only with suspicion above 0 and enough Solari';
      }
      return undefined;
    },
  },
  methods: {
    indexOf(mode: Mode): number {
      return this.playerinput.options.findIndex((option) => option.type === MODE_TYPE[mode]);
    },
    answer(mode: Mode): (response: InputResponse) => void {
      return (response) => this.onsave({type: 'or', index: this.indexOf(mode), response});
    },
    saveData(): void {
      if (this.chosen === 'smuggle') {
        (this.$refs.trade as {saveData: () => void} | undefined)?.saveData();
      } else if (this.paysInSolari && this.bribeInput !== undefined) {
        this.answer('bribe')({type: 'payment', payment: Payment.of({megacredits: this.bribeInput.amount})});
      } else {
        (this.$refs.payment as {saveData: () => void} | undefined)?.saveData();
      }
    },
  },
});
</script>
