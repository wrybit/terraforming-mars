<template>
  <!-- CHOAM tab of the action menu (Jens, 19 Oct 2026): one line per player with their open offer – or "no offer" –
       and behind it the move: accept another player's offer, withdraw one's own. Below, one's own new offer (the
       trade as before) with "Offer" in the footer. Replaces the CHOAM board tab top right. Two sections with a
       heading each, as wide as the two boxes of the trade, so offers and new offer read as one column. -->
  <div class="choam-input" data-test="choam-input">
    <section class="choam-input__section">
      <h3 class="hand-cards-panel__title choam-input__heading">{{ $t('Open offers') }}</h3>
      <div class="choam-input__market">
      <ul class="choam-input__lines">
        <li v-for="line in lines" :key="line.color" :class="['choam-input__line', {'choam-input__line--own': line.own}]">
          <PlayerChip :color="line.color" :players="playerView.players"/>
          <div class="choam-input__offers">
            <!-- The own empty line points to the new offer below (law of proximity across the gap) -->
            <span v-if="line.offers.length === 0" class="choam-input__none">{{ $t(line.own && offerInput !== undefined ? 'No offer yet – make one below' : 'No offer at the moment') }}</span>
            <div v-for="offer in line.offers" :key="offer.index" class="choam-input__offer">
              <span class="choam-input__goods"><b>{{ offer.giveAmount }}</b><img :src="icon(offer.give)" :alt="$t(label(offer.give))" :title="$t(label(offer.give))"></span>
              <span class="choam-input__arrow" aria-hidden="true">⇄</span>
              <span class="choam-input__goods"><b>{{ offer.wantAmount }}</b><img :src="icon(offer.want)" :alt="$t(label(offer.want))" :title="$t(label(offer.want))"></span>
              <!-- The move behind the offer; greyed out when it can't be made now (not paid for, not your turn) -->
              <AppButton size="small" :class="['choam-input__move', {'choam-input__move--withdraw': line.own}]"
                :title="$t(line.own ? 'Withdraw' : 'Accept')"
                :disabled="offer.choice === -1"
                @click="choose(offer.choice)"/>
            </div>
          </div>
        </li>
      </ul>
      <DuneRuleCards :rules="CHOAM_RULES"/>
      </div>
    </section>

    <section v-if="offerInput !== undefined" class="choam-input__section">
      <h3 class="hand-cards-panel__title choam-input__heading">{{ $t('Your offer') }}</h3>
      <SelectTrade ref="trade"
        :playerView="playerView" :playerinput="offerInput" :onsave="answerOffer" :showsave="false" :showtitle="false"/>
    </section>

    <TabPanelFooterSlot v-if="showsave && offerInput !== undefined">
      <div class="amount-select__actions">
        <AppButton hotkey="proceed" type="submit" :title="$t('Offer')" @click="saveData"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import SelectTrade from '@/client/components/SelectTrade.vue';
import PlayerChip from './PlayerChip.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import {CHOAM_RULES} from './duneRules';
import {duneGraphic} from './duneGraphic';
import {OrOptionsModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {ChoamModel} from '@/common/dune/DuneModel';
import {Resource} from '@/common/Resource';
import {Color} from '@/common/Color';
import {Message} from '@/common/logs/Message';
import {CHOAM_ACCEPT_OFFER_TITLE, CHOAM_WITHDRAW_TITLE} from '@/common/dune/duneActionTitles';

// Pictures and names of the resources in the Dune theme
const RESOURCE_GRAPHIC: Record<Resource, string> = {
  megacredits: 'coin',
  steel: 'res-plasteel',
  titanium: 'res-spice',
  plants: 'res-plant',
  energy: 'res-moisture',
  heat: 'res-water',
};

const RESOURCE_LABEL: Record<Resource, string> = {
  megacredits: 'M€',
  steel: 'Steel',
  titanium: 'Titanium',
  plants: 'Plants',
  energy: 'Energy',
  heat: 'Heat',
};

type OfferLine = {
  index: number,
  give: Resource,
  giveAmount: number,
  want: Resource,
  wantAmount: number,
  // Index of the server's choice behind the offer (accept or withdraw); -1 = not possible now
  choice: number,
};

type PlayerLine = {color: Color, own: boolean, offers: Array<OfferLine>};

export default defineComponent({
  name: 'ChoamInput',
  components: {AppButton, TabPanelFooterSlot, SelectTrade, PlayerChip, DuneRuleCards},
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
  computed: {
    CHOAM_RULES(): typeof CHOAM_RULES {
      return CHOAM_RULES;
    },
    choam(): ChoamModel | undefined {
      return this.playerView.game.dune?.choam;
    },
    offerInput(): SelectTradeModel | undefined {
      return this.playerinput.options.find((option): option is SelectTradeModel => option.type === 'trade');
    },
    // One line per player in seat order, the own one first; players without an offer too
    lines(): Array<PlayerLine> {
      const own = this.playerView.thisPlayer.color;
      const offers = this.choam?.offers ?? [];
      const players = [...this.playerView.players].sort((a, b) => Number(b.color === own) - Number(a.color === own));
      return players.map((player) => {
        const isOwn = player.color === own;
        return {
          color: player.color,
          own: isOwn,
          offers: offers
            .map((offer, index) => ({...offer, index}))
            .filter((offer) => offer.color === player.color)
            .map((offer) => ({
              index: offer.index,
              give: offer.give,
              giveAmount: offer.giveAmount,
              want: offer.want,
              wantAmount: offer.wantAmount,
              choice: this.choiceIndex(isOwn ? CHOAM_WITHDRAW_TITLE : CHOAM_ACCEPT_OFFER_TITLE, offer.index),
            })),
        };
      });
    },
  },
  methods: {
    icon(resource: Resource): string {
      return duneGraphic(RESOURCE_GRAPHIC[resource]);
    },
    label(resource: Resource): string {
      return RESOURCE_LABEL[resource];
    },
    // The server's choice with this title for the offer at `index` (server/dune/Choam.ts choamTabActions)
    choiceIndex(title: string, index: number): number {
      return this.playerinput.options.findIndex((option) => {
        const message = option.title as string | Message;
        return typeof message !== 'string' && message.message === title && Number(message.data[0]?.value) === index;
      });
    },
    choose(choice: number): void {
      if (choice !== -1) {
        this.onsave({type: 'or', index: choice, response: {type: 'option'}});
      }
    },
    answerOffer(response: InputResponse): void {
      const index = this.playerinput.options.findIndex((option) => option.type === 'trade');
      this.onsave({type: 'or', index, response});
    },
    saveData(): void {
      (this.$refs.trade as {saveData: () => void} | undefined)?.saveData();
    },
  },
});
</script>
