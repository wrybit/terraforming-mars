<template>
  <!-- Pacts of the CHOAM tab (formerly the CHOAM tab, Jens 19 and 24 Oct 2026): a box with one line per player and their
       open offer – or "no offer" – and the move behind it (accept another player's offer, withdraw one's own); below a
       box with one's own new offer (the free trade) and a quiet line with fee, time and envy. -->
  <div class="choam-order" data-test="choam-pacts">
    <div class="choam-card choam-open">
      <h4 class="choam-card__title">{{ $t('Open offers') }}</h4>
      <div v-for="line in lines" :key="line.color" class="choam-open__row">
        <PlayerChip :color="line.color" :players="playerView.players"/>
        <span v-if="line.offers.length === 0" class="choam-info">{{ $t(line.own && offerInput !== undefined ? 'No offer yet, make one below' : 'No offer at the moment') }}</span>
        <template v-for="offer in line.offers" :key="offer.index">
          <span class="choam-input__goods"><b>{{ offer.giveAmount }}</b><img :src="graphic(offer.give)" :alt="$t(label(offer.give))" :title="$t(label(offer.give))"></span>
          <span class="choam-input__arrow" aria-hidden="true">⇄</span>
          <span class="choam-input__goods"><b>{{ offer.wantAmount }}</b><img :src="graphic(offer.want)" :alt="$t(label(offer.want))" :title="$t(label(offer.want))"></span>
          <span class="choam-open__note">{{ noteLabel(offer) }}</span>
          <AppButton size="small" :class="['choam-input__move', {'choam-input__move--withdraw': line.own}]"
            :title="$t(line.own ? 'Withdraw' : 'Accept')" :disabled="offer.choice === -1" @click="$emit('choose', offer.choice)"/>
        </template>
      </div>
    </div>

    <div class="choam-card choam-form">
      <h4 class="choam-card__title">{{ $t('Your offer') }}</h4>
      <template v-if="offerInput !== undefined">
        <SelectTrade ref="trade" :playerView="playerView" :playerinput="offerInput" :onsave="answerOffer" :showsave="false" :showtitle="false"/>
        <p class="choam-info">{{ feeLabel }}</p>
      </template>
      <p v-else class="choam-info">{{ $t(ownOpen ? 'You already have an offer open, withdraw it to make a new one.' : 'Nothing to offer') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import SelectTrade from '@/client/components/SelectTrade.vue';
import PlayerChip from './PlayerChip.vue';
import {ChoamModel} from '@/common/dune/DuneModel';
import {ExchangeModel} from '@/common/dune/smugglingExchange';
import {PlayerInputModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {CHOAM_ACCEPT_OFFER_TITLE, CHOAM_OFFER_TITLE, CHOAM_WITHDRAW_TITLE} from '@/common/dune/duneActionTitles';
import {Resource} from '@/common/Resource';
import {Color} from '@/common/Color';
import {translateTextWithParams} from '@/client/directives/i18n';
import {RESOURCE_LABEL, choiceIndex, resourceGraphic, titleKey} from './choamGraphics';

/** The fee each side pays on a deal and how long an offer stands (server/dune/Choam.ts) */
const FEE = 1;
const OFFER_GENERATIONS = 2;

type OfferLine = {
  index: number,
  give: Resource,
  giveAmount: number,
  want: Resource,
  wantAmount: number,
  expires: number,
  // Index of the server's choice behind the offer (accept or withdraw); -1 = not possible now
  choice: number,
};

type PlayerLine = {color: Color, own: boolean, offers: Array<OfferLine>};

export default defineComponent({
  name: 'PactsPane',
  components: {AppButton, SelectTrade, PlayerChip},
  props: {
    playerView: {type: Object as PropType<PlayerViewModel>, required: true},
    options: {type: Array as PropType<ReadonlyArray<PlayerInputModel>>, required: true},
    choam: {type: Object as PropType<ChoamModel>, required: true},
    exchange: {type: Object as PropType<ExchangeModel>, required: true},
  },
  emits: ['choose', 'offer'],
  computed: {
    offerInput(): SelectTradeModel | undefined {
      return this.options.find((option): option is SelectTradeModel => option.type === 'trade' && titleKey(option) === CHOAM_OFFER_TITLE);
    },
    ownOpen(): boolean {
      return this.choam.offers.some((offer) => offer.color === this.playerView.thisPlayer.color);
    },
    feeLabel(): string {
      return translateTextWithParams('Fee ${0} Solari for both, only on the deal · stands ${1} generations · envy +1', [String(FEE), String(OFFER_GENERATIONS)]);
    },
    // One line per player in seat order, the own one first; players without an offer too
    lines(): Array<PlayerLine> {
      const own = this.playerView.thisPlayer.color;
      const players = [...this.playerView.players].sort((a, b) => Number(b.color === own) - Number(a.color === own));
      return players.map((player) => {
        const isOwn = player.color === own;
        return {
          color: player.color,
          own: isOwn,
          offers: this.choam.offers
            .map((offer, index) => ({...offer, index}))
            .filter((offer) => offer.color === player.color)
            .map((offer) => ({
              index: offer.index, give: offer.give, giveAmount: offer.giveAmount, want: offer.want, wantAmount: offer.wantAmount,
              expires: offer.expires,
              choice: choiceIndex(this.options, isOwn ? CHOAM_WITHDRAW_TITLE : CHOAM_ACCEPT_OFFER_TITLE, offer.index),
            })),
        };
      });
    },
  },
  methods: {
    graphic(resource: Resource): string {
      return resourceGraphic(resource);
    },
    label(resource: Resource): string {
      return RESOURCE_LABEL[resource];
    },
    // Until when the offer stands and what both sides are worth at the guild today: helps judging it
    noteLabel(offer: OfferLine): string {
      const sell = this.exchange.sell.history[this.exchange.sell.history.length - 1];
      return translateTextWithParams('until G${0} · guild: ${1} ⇄ ${2} Solari',
        [String(offer.expires), String(offer.giveAmount * sell[offer.give]), String(offer.wantAmount * sell[offer.want])]);
    },
    answerOffer(response: InputResponse): void {
      const index = this.options.findIndex((option) => titleKey(option) === CHOAM_OFFER_TITLE);
      this.$emit('offer', index, response);
    },
    saveData(): void {
      (this.$refs.trade as {saveData: () => void} | undefined)?.saveData();
    },
  },
});
</script>
