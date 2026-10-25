<template>
  <!-- Privilege of the CHOAM tab (Jens 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html). Open: what leaves the
       stock and what the emperor pays, as before → after, with a quiet line below. Delivered: one box with asked →
       delivered → got and the chip of the player who took it, the same for everybody. -->
  <div class="choam-privilege-pane">
    <div v-if="privilege.takenBy !== undefined" class="choam-card choam-done" data-test="choam-privilege-done">
      <div class="choam-done__head">
        <h4 class="choam-card__title">{{ titleLabel }}</h4>
        <span class="choam-done__by">{{ $t('delivered by') }} <PlayerChip :color="privilege.takenBy" :players="playerView.players"/></span>
      </div>
      <div class="choam-done__flow">
        <div class="choam-done__part">
          <span class="choam-done__label">{{ $t('Asked') }}</span>
          <span class="choam-done__value"><img :src="graphic(privilege.good)" alt="">{{ privilege.amount }}</span>
        </div>
        <span class="choam-done__arrow" aria-hidden="true">→</span>
        <div class="choam-done__part">
          <span class="choam-done__label">{{ $t('Delivered') }}</span>
          <span class="choam-done__value"><img :src="graphic(privilege.good)" alt="">{{ privilege.amount }} ✓</span>
        </div>
        <span class="choam-done__arrow" aria-hidden="true">→</span>
        <div class="choam-done__part choam-done__part--gain">
          <span class="choam-done__label">{{ $t('Received') }}</span>
          <span class="choam-done__value"><img :src="coin" alt="">+{{ privilege.pay }}</span>
        </div>
      </div>
      <p class="choam-info">{{ normalLabel }}</p>
    </div>
    <div v-else class="choam-privilege" data-test="choam-privilege">
      <div class="smuggle-input__bribe">
        <AmountSideTile :side="goodSide" :before="stock" :after="Math.max(0, stock - privilege.amount)" :change="privilege.amount" direction="loss"/>
        <AmountSideTile :side="SOLARI" :before="solari" :after="solari + privilege.pay" :change="privilege.pay" direction="gain"/>
      </div>
      <p class="choam-info choam-info--block">
        {{ onlyOneLabel }}<br>{{ compareLabel }}<template v-if="missing > 0"><br>{{ missingLabel }}</template>
      </p>
    </div>
    <!-- The wish of the next generation, small and quiet: who wants it can hoard the goods now (Jens 25 Oct 2026) -->
    <div v-if="upcoming !== undefined" class="choam-card choam-upcoming" data-test="choam-privilege-next">
      <h4 class="choam-card__title">{{ $t('Next generation') }}</h4>
      <div class="choam-upcoming__wish">
        <span class="choam-upcoming__value"><img :src="graphic(upcoming.good)" alt="">{{ upcoming.amount }}</span>
        <span class="choam-upcoming__arrow" aria-hidden="true">→</span>
        <span class="choam-upcoming__value"><img :src="coin" alt="">{{ upcoming.pay }}</span>
      </div>
      <p class="choam-info">{{ upcomingStockLabel }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AmountSideTile from '@/client/components/amount/AmountSideTile.vue';
import {AmountSide} from '@/client/components/amount/amountConversion';
import PlayerChip from './PlayerChip.vue';
import {PrivilegeModel} from '@/common/dune/DuneModel';
import {ExchangeModel} from '@/common/dune/smugglingExchange';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {resourceSnapshot} from '@/client/components/selectPlayerResource';
import {RESOURCE_LABEL, resourceGraphic} from './choamGraphics';
import {duneGraphic} from './duneGraphic';

const SOLARI: AmountSide = {kind: 'stock', resource: Resource.MEGACREDITS, perStep: 1};

export default defineComponent({
  name: 'PrivilegePane',
  components: {AmountSideTile, PlayerChip},
  props: {
    playerView: {type: Object as PropType<PlayerViewModel>, required: true},
    privilege: {type: Object as PropType<PrivilegeModel>, required: true},
    exchange: {type: Object as PropType<ExchangeModel>, required: true},
    /** The privilege of the next generation (undefined for games without the preview) */
    upcoming: {type: Object as PropType<PrivilegeModel>, required: false, default: undefined},
  },
  computed: {
    SOLARI(): AmountSide {
      return SOLARI;
    },
    coin(): string {
      return duneGraphic('coin');
    },
    goodSide(): AmountSide {
      return {kind: 'stock', resource: this.privilege.good, perStep: 1};
    },
    stock(): number {
      return resourceSnapshot(this.playerView.thisPlayer, this.privilege.good).stock;
    },
    solari(): number {
      return this.playerView.thisPlayer.megacredits;
    },
    missing(): number {
      return Math.max(0, this.privilege.amount - this.stock);
    },
    // What the guild pays today for the same goods: shows how much better the privilege is
    guildToday(): number {
      const history = this.exchange.sell.history;
      return history[history.length - 1][this.privilege.good] * this.privilege.amount;
    },
    titleLabel(): string {
      return translateTextWithParams('Privilege G${0}', [String(this.privilege.generation)]);
    },
    normalLabel(): string {
      return translateTextWithParams('Normal worth ${0}', [String(this.privilege.worth)]);
    },
    onlyOneLabel(): string {
      return translateTextWithParams('Only one player gets it · until the end of G${0}', [String(this.privilege.generation)]);
    },
    compareLabel(): string {
      return translateTextWithParams('Guild today: ${0} Solari · privilege: ${1} Solari · envy +1', [String(this.guildToday), String(this.privilege.pay)]);
    },
    upcomingStockLabel(): string {
      const upcoming = this.upcoming;
      if (upcoming === undefined) {
        return '';
      }
      const have = resourceSnapshot(this.playerView.thisPlayer, upcoming.good).stock;
      return translateTextWithParams('G${0} · in your stock: ${1} of ${2}', [String(upcoming.generation), String(have), String(upcoming.amount)]);
    },
    missingLabel(): string {
      return translateTextWithParams('You lack ${0} ${1}', [String(this.missing), translateText(RESOURCE_LABEL[this.privilege.good])]);
    },
  },
  methods: {
    graphic(resource: Resource): string {
      return resourceGraphic(resource);
    },
  },
});
</script>
