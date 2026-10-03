<template>
  <!-- [−] [icon amount] [+] [→ target]: the currency icon sits inside the field, so all icons share one axis.
       The target button names the value it sets instead of a vague "MAX" (payments.less). -->
  <div class="payments_type input-group" :data-test="unit">
    <AppButton type="minus" :disabled="minusDisabled" @click="$emit('minus')" />
    <span class="payments_field">
      <i class="resource_icon payments_type_icon" :class="iconClass" :title="$t('Pay with ' + description)"></i>
      <input
        class="form-input form-inline payments_input"
        :value="modelValue"
        @input="onInput"
      >
    </span>
    <AppButton type="plus" :disabled="plusDisabled" @click="$emit('plus')" />
    <template v-if="showMax && target !== undefined">
      <!-- Target reached: a plain status instead of a greyed-out button, so "done" never looks like "broken" -->
      <span v-if="targetReached"
        class="payments_target payments_target--reached"
        :title="$t('Already paying as much as useful with this resource')"
        data-test="target-reached">
        <span aria-hidden="true">✓</span><span class="payments_target_label" v-i18n>Max</span>
      </span>
      <button v-else
        type="button"
        class="payments_target"
        :title="$t('Pay as much as useful with this resource')"
        data-test="target"
        @click="$emit('max')">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h8M8 4.5 11.5 8 8 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>{{ target }}</span>
      </button>
    </template>
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
    // Target already set: shows "✓ Max" instead of the button
    targetReached: {
      type: Boolean,
      default: false,
    },
    // +/− would change nothing (at the limit or at 0): shown disabled like everywhere else in the app
    minusDisabled: {
      type: Boolean,
      default: false,
    },
    plusDisabled: {
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
