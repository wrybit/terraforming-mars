<template>
  <!-- CHOAM tab of the action menu (Jens 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html): smuggling and the CHOAM
       contracts as one module. On top the envy track with every player's marker, then the five moves as a switch on
       the top edge of one box – guild, prophecy, privilege, pacts, tribute. Each pane starts with a quiet sentence that
       says what it is for. At envy 5 (the top) every pane but the tribute says CHOAM is closed. The footer button belongs to
       the chosen move. -->
  <div class="smuggle-input choam-exchange" data-test="choam-exchange">
    <!-- Title and claim as one head: what CHOAM is in the story (Jens 25 Oct 2026) -->
    <header class="choam-head">
      <h3 class="dune-board__title smuggle-input__title"><img class="dune-board__icon" :src="choamIcon" alt="">{{ $t('CHOAM') }}</h3>
      <p class="choam-claim">{{ $t('The universal development company of the empire.') }}<br>{{ $t('A seat at CHOAM means wealth and political weight.') }}</p>
    </header>
    <SmugglingPanel v-if="smuggling !== undefined" :smuggling="smuggling" :players="playerView.players" :compact="true"/>

    <section class="smuggle-input__move">
      <div class="smuggle-input__modes" role="radiogroup">
        <button v-for="mode in MODES" :key="mode.id" type="button" role="radio"
          :class="['smuggle-input__mode', {'smuggle-input__mode--on': mode.id === chosen, 'smuggle-input__mode--blocked': !possible(mode.id)}]"
          :aria-checked="mode.id === chosen" @click="chosen = mode.id">
          {{ $t(mode.label) }}
          <span v-if="mode.id === 'tribute' && ownBribeCost !== undefined" class="button-count button-count--megacredits">{{ ownBribeCost }}</span>
          <!-- A privilege nobody took yet: a small green dot -->
          <span v-if="mode.id === 'privilege' && smuggling?.privilege.takenBy === undefined" class="smuggle-input__news"></span>
        </button>
      </div>

      <div class="smuggle-input__stage">
        <div class="smuggle-input__pane">
          <p class="choam-info choam-lead">
            <template v-for="(line, index) in leadLines" :key="index"><br v-if="index > 0">{{ line }}</template>
          </p>
          <p v-if="closedReason !== undefined" class="choam-info choam-closed" data-test="choam-closed">{{ closedReason }}</p>
          <template v-else-if="smuggling !== undefined">
            <SelectTrade v-if="chosen === 'guild' && guildInput !== undefined" ref="trade" :playerView="playerView" :playerinput="guildInput"
              :onsave="answerTo(guildIndex)" :showsave="false" :showtitle="false" :exchange="smuggling.exchange"/>
            <ProphecyPane v-else-if="chosen === 'prophecy'" ref="prophecy" :playerView="playerView" :options="options"
              :exchange="smuggling.exchange" :orders="smuggling.orders" @withdraw="choose" @ready="prophecyReady = $event"/>
            <PrivilegePane v-else-if="chosen === 'privilege'" :playerView="playerView" :privilege="smuggling.privilege" :exchange="smuggling.exchange"/>
            <PactsPane v-else-if="chosen === 'pacts' && choam !== undefined" ref="pacts" :playerView="playerView" :options="options"
              :choam="choam" :exchange="smuggling.exchange" @choose="choose" @offer="answerOffer"/>
            <template v-else-if="chosen === 'tribute' && tributeInput !== undefined">
              <div v-if="paysInSolari" class="smuggle-input__bribe" data-test="choam-tribute">
                <AmountSideTile :side="SOLARI" :before="solari" :after="solari - tributeInput.amount" :change="tributeInput.amount" direction="loss"/>
                <AmountSideTile :side="envySide" :before="ownEnvy" :after="ownEnvy - 1" :change="1" direction="loss"/>
              </div>
              <!-- Other means of payment (heat for Helion …): the usual payment form -->
              <SelectPayment v-else ref="payment" :playerView="playerView" :playerinput="tributeInput"
                :onsave="answerTo(tributeIndex)" :showsave="false" :showtitle="false"/>
            </template>
          </template>
        </div>
      </div>
    </section>

    <!-- The rules below everything behind the "Rules" button, like on the other Dune tabs -->
    <DuneRuleCards class="smuggle-input__rules" :rules="CHOAM_RULES"/>

    <TabPanelFooterSlot v-if="showsave">
      <div class="amount-select__actions">
        <AppButton hotkey="proceed" type="submit" :title="$t(FOOTER[chosen])" :disabled="!canSave" @click="saveData"/>
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
import ProphecyPane from './ProphecyPane.vue';
import PrivilegePane from './PrivilegePane.vue';
import PactsPane from './PactsPane.vue';
import {CHOAM_RULES} from './duneRules';
import {duneGraphic} from './duneGraphic';
import {choiceIndex, titleKey} from './choamGraphics';
import {OrOptionsModel, PlayerInputModel, SelectPaymentModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {ChoamModel, MAX_SUSPICION, SmugglingModel} from '@/common/dune/DuneModel';
import {
  CHOAM_ACCEPT_OFFER_TITLE, CHOAM_OFFER_TITLE, PRIVILEGE_TITLE, PROPHECY_BUY_TITLE, PROPHECY_SELL_TITLE, PROPHECY_WITHDRAW_TITLE, SMUGGLE_TITLE,
} from '@/common/dune/duneActionTitles';
import {Payment} from '@/common/inputs/Payment';
import {Resource} from '@/common/Resource';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

type Mode = 'guild' | 'prophecy' | 'privilege' | 'pacts' | 'tribute';

// Order of the switch (Jens 24 Oct 2026)
const MODES: ReadonlyArray<{id: Mode, label: string}> = [
  {id: 'guild', label: 'Guild'},
  {id: 'prophecy', label: 'Prophecy'},
  {id: 'privilege', label: 'Privilege'},
  {id: 'pacts', label: 'Pacts'},
  {id: 'tribute', label: 'Tribute'},
];

// One sentence per pane: what you can do there (Jens 24 Oct 2026); the tribute tells the story in two
const LEAD: Readonly<Record<Mode, ReadonlyArray<string>>> = {
  guild: ['Trade goods at once at the guild\'s rate of the day.'],
  prophecy: ['Name a rate you wish for, once the market reaches it, the trade happens by itself.'],
  privilege: ['The emperor wants a good and pays a multiple, but only to the first.'],
  pacts: ['Make deals directly with other players.'],
  tribute: ['Your deals stir the envy of the great houses, in the Landsraad they take revenge for it.', 'A generous tribute appeases them.'],
};

const FOOTER: Readonly<Record<Mode, string>> = {guild: 'Trade now', prophecy: 'Prophesy', privilege: 'Deliver', pacts: 'Offer', tribute: 'Pay tribute'};

const SOLARI: AmountSide = {kind: 'stock', resource: Resource.MEGACREDITS, perStep: 1};

type SaveForm = {saveData: () => void};

export default defineComponent({
  name: 'ChoamExchangeInput',
  components: {AppButton, TabPanelFooterSlot, SelectTrade, SelectPayment, AmountSideTile, SmugglingPanel, DuneRuleCards, ProphecyPane, PrivilegePane, PactsPane},
  props: {
    playerView: {type: Object as PropType<PlayerViewModel>, required: true},
    playerinput: {type: Object as PropType<OrOptionsModel>, required: true},
    onsave: {type: Function as PropType<(out: OrOptionsResponse) => void>, required: true},
    showsave: {type: Boolean, required: true},
    showtitle: {type: Boolean, default: false},
  },
  data() {
    // The guild first when it is possible, otherwise the tribute (envy at the top)
    const guild = this.playerinput.options.some((option) => titleKey(option) === SMUGGLE_TITLE);
    return {chosen: (guild ? 'guild' : 'tribute') as Mode, prophecyReady: false};
  },
  computed: {
    MODES(): typeof MODES {
      return MODES;
    },
    FOOTER(): typeof FOOTER {
      return FOOTER;
    },
    SOLARI(): AmountSide {
      return SOLARI;
    },
    CHOAM_RULES(): typeof CHOAM_RULES {
      return CHOAM_RULES;
    },
    choamIcon(): string {
      return duneGraphic('choam');
    },
    options(): ReadonlyArray<PlayerInputModel> {
      return this.playerinput.options;
    },
    smuggling(): SmugglingModel | undefined {
      return this.playerView.game.dune?.smuggling;
    },
    choam(): ChoamModel | undefined {
      return this.playerView.game.dune?.choam;
    },
    leadLines(): ReadonlyArray<string> {
      return LEAD[this.chosen].map((line) => translateText(line));
    },
    ownEnvy(): number {
      return this.smuggling?.suspicion.find((entry) => entry.color === this.playerView.thisPlayer.color)?.level ?? 0;
    },
    ownBribeCost(): number | undefined {
      return this.smuggling?.suspicion.find((entry) => entry.color === this.playerView.thisPlayer.color)?.bribeCost;
    },
    envySide(): AmountSide {
      return {kind: 'figure', label: 'Envy', icon: duneGraphic('res-landsraad'), perStep: 1, before: this.ownEnvy};
    },
    guildIndex(): number {
      return choiceIndex(this.options, SMUGGLE_TITLE);
    },
    guildInput(): SelectTradeModel | undefined {
      return this.options[this.guildIndex] as SelectTradeModel | undefined;
    },
    tributeIndex(): number {
      return this.options.findIndex((option) => option.type === 'payment');
    },
    tributeInput(): SelectPaymentModel | undefined {
      return this.options[this.tributeIndex] as SelectPaymentModel | undefined;
    },
    solari(): number {
      return this.playerView.thisPlayer.megacredits;
    },
    paysInSolari(): boolean {
      return this.tributeInput !== undefined && this.solari >= this.tributeInput.amount;
    },
    // Why the chosen pane has nothing to do, shown in its place (Jens, 19 Oct 2026: say what is missing)
    closedReason(): string | undefined {
      if (this.chosen !== 'tribute' && this.ownEnvy >= MAX_SUSPICION) {
        return translateText('The great houses stand against you: CHOAM is closed until you pay tribute');
      }
      if (this.chosen === 'guild' && this.guildInput === undefined) {
        return translateText('Nothing worth trading');
      }
      if (this.chosen === 'tribute' && this.tributeInput === undefined) {
        if (this.ownEnvy < 1) {
          return translateText('The houses are well disposed: no tribute needed');
        }
        return translateTextWithParams('Too few Solari: the tribute costs ${0}, you have ${1}', [String(this.ownBribeCost ?? 0), String(this.solari)]);
      }
      return undefined;
    },
    canSave(): boolean {
      if (this.closedReason !== undefined) {
        return false;
      }
      const ready: Record<Mode, boolean> = {
        guild: this.guildInput !== undefined,
        prophecy: this.prophecyReady,
        privilege: choiceIndex(this.options, PRIVILEGE_TITLE) !== -1,
        pacts: choiceIndex(this.options, CHOAM_OFFER_TITLE) !== -1,
        tribute: this.tributeInput !== undefined,
      };
      return ready[this.chosen];
    },
  },
  methods: {
    // Whether a move has anything to do now (the switch greys out the others)
    possible(mode: Mode): boolean {
      switch (mode) {
      case 'guild': return this.guildIndex !== -1;
      case 'prophecy': return [PROPHECY_SELL_TITLE, PROPHECY_BUY_TITLE, PROPHECY_WITHDRAW_TITLE].some((title) => choiceIndex(this.options, title) !== -1);
      case 'privilege': return choiceIndex(this.options, PRIVILEGE_TITLE) !== -1;
      case 'pacts': return [CHOAM_OFFER_TITLE, CHOAM_ACCEPT_OFFER_TITLE].some((title) => choiceIndex(this.options, title) !== -1);
      case 'tribute': return this.tributeIndex !== -1;
      }
    },
    answerTo(index: number): (response: InputResponse) => void {
      return (response) => this.onsave({type: 'or', index, response});
    },
    answerOffer(index: number, response: InputResponse): void {
      if (index !== -1) {
        this.onsave({type: 'or', index, response});
      }
    },
    choose(index: number): void {
      if (index !== -1) {
        this.onsave({type: 'or', index, response: {type: 'option'}});
      }
    },
    form(name: string): SaveForm | undefined {
      return this.$refs[name] as SaveForm | undefined;
    },
    prophecyAnswer(): {index: number, response: InputResponse} | undefined {
      return (this.$refs.prophecy as {answer: () => {index: number, response: InputResponse} | undefined} | undefined)?.answer();
    },
    saveData(): void {
      switch (this.chosen) {
      case 'guild':
        this.form('trade')?.saveData();
        break;
      case 'prophecy': {
        const answer = this.prophecyAnswer();
        if (answer !== undefined) {
          this.onsave({type: 'or', index: answer.index, response: answer.response});
        }
        break;
      }
      case 'privilege':
        this.choose(choiceIndex(this.options, PRIVILEGE_TITLE));
        break;
      case 'pacts':
        this.form('pacts')?.saveData();
        break;
      case 'tribute':
        if (this.paysInSolari && this.tributeInput !== undefined) {
          this.answerTo(this.tributeIndex)({type: 'payment', payment: Payment.of({megacredits: this.tributeInput.amount})});
        } else {
          this.form('payment')?.saveData();
        }
        break;
      }
    },
  },
});
</script>
