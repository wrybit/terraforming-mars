<template>
  <!-- Amount (Insulation, Power Infrastructure …): slider instead of a number field. Known conversions
       (amountConversion.ts) show source and target before → after, otherwise only the slider -->
  <div class="amount-select">
    <div v-if="showtitle === true" class="amount-select__title">{{ $t(playerinput.title) }}</div>
    <!-- As a choice block: centered in the tab box like other decisions (choice_block.less) -->
    <div v-if="conversion !== undefined" class="choice-block choice-block--natural">
      <AmountConverter v-model="amount" :conversion="conversion"
        :min="minimum" :max="maximum" :player="playerView.thisPlayer" :sourceCard="sourceCard"/>
    </div>
    <div v-else class="amount-slider-plain">
      <AmountSlider v-model="amount" :min="minimum" :max="maximum"/>
    </div>
    <TabPanelFooterSlot>
      <div v-if="showsave === true" class="amount-select__actions">
        <AppButton hotkey="proceed" type="submit" @click="saveData" :title="buttonTitle" :counts="buttonCounts" />
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
import {ButtonCountPart, resourceCountKind} from '@/client/components/common/buttonCount';

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
        (this.playerinput.max ?? this.playerinput.min ?? 0) : (this.playerinput.min ?? 0),
    };
  },
  computed: {
    // Defensive for incomplete models (only the type set): range 0..0
    minimum(): number {
      return this.playerinput.min ?? 0;
    },
    maximum(): number {
      return this.playerinput.max ?? this.minimum;
    },
    sourceCard(): CardName | undefined {
      return inputSourceCard(this.playerinput);
    },
    conversion(): AmountConversion | undefined {
      return amountConversion(this.playerinput.title, this.sourceCard);
    },
    // Known conversion: what is spent, as a resource counter in the button ("Spend energy" with an energy badge)
    buttonCounts(): Array<ButtonCountPart> {
      const from = this.conversion?.from;
      const kind = from === undefined ? undefined : resourceCountKind(from.resource);
      if (from === undefined || kind === undefined) {
        return [];
      }
      return [{kind, value: this.amount * from.perStep}];
    },
    // The button names action and amount ("Decrease 5"); with a counter the counter shows the amount
    buttonTitle(): string {
      const label = this.$t(this.playerinput.buttonLabel || 'Confirm');
      return this.buttonCounts.length > 0 ? label : label + ' ' + this.amount;
    },
  },
  methods: {
    saveData() {
      this.onsave({type: 'amount', amount: this.amount});
    },
  },
});
</script>
