<template>
  <!-- [−] [icon amount] [+] [→ target]: the currency icon sits inside the field, so all icons share one axis.
       The target button names the value it sets instead of a vague "MAX" (payments.less). -->
  <div class="payments_type input-group" :data-test="unit">
    <AppButton type="minus" @click="$emit('minus')" />
    <span class="payments_field">
      <i class="resource_icon payments_type_icon" :class="iconClass" :title="$t('Pay with ' + description)"></i>
      <input
        class="form-input form-inline payments_input"
        :value="modelValue"
        @input="onInput"
      >
    </span>
    <AppButton type="plus" @click="$emit('plus')" />
    <button v-if="showMax && target !== undefined"
      type="button"
      class="payments_target"
      :class="{'payments_target--reached': targetReached}"
      :disabled="targetReached"
      :title="$t('Balance the payment with this resource')"
      data-test="target"
      @click="$emit('max')">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h8M8 4.5 11.5 8 8 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>{{ target }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {SpendableResource} from '@/common/inputs/Spendable';
import {paymentIconClass} from '@/client/components/paymentIcon';

export default defineComponent({
  name: 'PaymentUnitComponent',
  props: {
    // TODO(kberg): Rename to count.
    modelValue: {
      type: Number,
      required: true,
    },
    unit: {
      type: String as () => SpendableResource,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    showMax: {
      type: Boolean,
      default: true,
      required: false,
    },
    // Value the target button sets (computed by PaymentForm with the same logic as the click)
    target: {
      type: Number,
      required: false,
      default: undefined,
    },
    // Target already set: the button is greyed out
    targetReached: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    AppButton,
  },
  computed: {
    iconClass(): string {
      return paymentIconClass(this.unit);
    },
  },
  methods: {
    onInput(event: Event) {
      this.$emit('update:modelValue', (event.target as HTMLInputElement).value);
    },
  },
});
</script>
