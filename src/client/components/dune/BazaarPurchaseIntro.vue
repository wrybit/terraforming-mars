<template>
  <!-- Middle of the bazaar purchase tab (Jens, 19 Oct 2026): one tile like the options of a simple decision
       (ChoiceOptionTile.vue, e.g. adding microbes to a card) – what is paid ➜ what is gained, below it the own stock
       before → after. The payment itself (cost, rest, cancel, pay) sits in the footer -->
  <div class="choice-options choice-block dune-bazaar-purchase" :style="choiceBlockStyle(1)">
    <div class="choice-option choice-option--selected choice-option--resource">
      <span class="choice-option-icons">
        <span class="choice-option-item">
          <span class="choice-option-amount choice-option-amount--loss">−{{ price }}</span>
          <i class="resource_icon choice-option-icon resource_icon--megacredits"></i>
        </span>
        <i class="choice-option-arrow" aria-hidden="true"></i>
        <span v-for="row in gains" :key="row.key" class="choice-option-item">
          <span class="choice-option-amount choice-option-amount--gain">+{{ row.amount }}</span>
          <i :class="'choice-option-icon ' + row.iconClass"></i>
        </span>
      </span>
      <span>{{ $t(ware) }}</span>
      <div class="choice-option-value">
        <div class="choice-option-table choice-option-table--single">
          <span></span>
          <span class="choice-option-value-label">{{ $t('Stock') }}</span>
          <template v-for="row in rows" :key="row.key">
            <i :class="'choice-option-row-icon ' + row.iconClass"></i>
            <span class="choice-option-number">
              {{ row.before }}<span :class="['choice-option-after', row.amount > 0 ? 'choice-option-after--gain' : 'choice-option-after--loss']">→{{ row.before + row.amount }}</span>
            </span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Message} from '@/common/logs/Message';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {BazaarGood, bazaarWare} from '@/common/dune/bazaarWares';
import {choiceBlockStyle} from '@/client/components/choiceBlock';

const props = defineProps<{
  // Title of the purchase option (BAZAAR_BUY_TITLE): ware name and own price as its values
  title: Message;
  player: PublicPlayerModel;
}>();

const ware = computed(() => String(props.title.data[0]?.value ?? ''));
const price = computed(() => Number(props.title.data[1]?.value ?? 0));

// Icon of each good as on the tiles of a decision (resources.less, resource_options.less)
const GOOD_ICON: Record<BazaarGood, string> = {
  steel: 'resource_icon resource_icon--steel',
  titanium: 'resource_icon resource_icon--titanium',
  plants: 'resource_icon resource_icon--plants',
  energy: 'resource_icon resource_icon--energy',
  heat: 'resource_icon resource_icon--heat',
  cards: 'choice-option-gain--card',
  tr: 'choice-option-gain--tr',
};

// Own amount of each good before the purchase
function amountOf(good: BazaarGood): number {
  switch (good) {
  case 'steel': return props.player.steel;
  case 'titanium': return props.player.titanium;
  case 'plants': return props.player.plants;
  case 'energy': return props.player.energy;
  case 'heat': return props.player.heat;
  case 'cards': return props.player.cardsInHandNbr;
  case 'tr': return props.player.terraformRating;
  }
}

type Row = {key: string, iconClass: string, amount: number, before: number};

const gains = computed<Array<Row>>(() => (Object.entries(bazaarWare(ware.value).content) as Array<[BazaarGood, number]>)
  .map(([good, amount]) => ({key: good, iconClass: GOOD_ICON[good], amount, before: amountOf(good)})));

// Stock table: M€ first (what is paid), then the goods
const rows = computed<Array<Row>>(() => [
  {key: 'megacredits', iconClass: 'resource_icon resource_icon--megacredits', amount: -price.value, before: props.player.megacredits},
  ...gains.value,
]);
</script>
