<template>
  <!-- Amount (Insulation, Power Infrastructure …): slider instead of a number field. Known conversions
       (amountConversion.ts) show source and target before → after, otherwise only the slider -->
  <div class="amount-select">
    <div v-if="showtitle === true" class="amount-select__title">{{ $t(playerinput.title) }}</div>
    <!-- As a choice block: centered in the tab box like other decisions (choice_block.less) -->
    <div v-if="conversion !== undefined" class="choice-block choice-block--natural">
      <AmountConverter v-model="amount" :conversion="conversion"
        :min="playerinput.min" :max="playerinput.max" :player="playerView.thisPlayer" :sourceCard="sourceCard"/>
    </div>
    <div v-else class="amount-slider-plain">
      <AmountSlider v-model="amount" :min="playerinput.min" :max="playerinput.max"/>
    </div>
    <TabPanelFooterSlot>
      <div v-if="showsave === true" class="amount-select__actions">
        <AppButton type="submit" @click="saveData" :title="buttonTitle" />
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import AmountConverter from '@/client/components/amount/AmountConverter.vue';
import AmountSlider from '@/client/components/amount/AmountSlider.vue';
import {SelectAmountModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectAmountResponse} from '@/common/inputs/InputResponse';
import {CardName} from '@/common/cards/CardName';
import {inputSourceCard} from '@/client/components/inputSourceCard';
import {AmountConversion, amountConversion} from '@/client/components/amount/amountConversion';

export default defineComponent({
  name: 'SelectAmount',
  components: {
    AppButton,
    AmountConverter,
    AmountSlider,
    TabPanelFooterSlot,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectAmountModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectAmountResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data() {
    return {
      // Conversions start at the maximum (most common case), other amounts as the server says
      amount: this.playerinput.maxByDefault || amountConversion(this.playerinput.title, inputSourceCard(this.playerinput)) !== undefined ?
        this.playerinput.max : this.playerinput.min,
    };
  },
  computed: {
    sourceCard(): CardName | undefined {
      return inputSourceCard(this.playerinput);
    },
    conversion(): AmountConversion | undefined {
      return amountConversion(this.playerinput.title, this.sourceCard);
    },
    // The button names action and amount ("Decrease 5")
    buttonTitle(): string {
      return this.$t(this.playerinput.buttonLabel || 'Confirm') + ' ' + this.amount;
    },
  },
  methods: {
    saveData() {
      this.onsave({type: 'amount', amount: this.amount});
    },
  },
});
</script>
