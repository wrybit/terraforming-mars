<template>
  <!-- A translated label with its amounts of money as coins (moneyText.ts): "Award (14 M€)" → Award + coin 14.
       The spaces around a coin are margins, not text: v-i18n trims the text nodes of a button ("Pay tribute14") -->
  <template v-for="(part, index) in parts" :key="index">
    <template v-if="part.kind === 'text'">{{ part.text }}</template>
    <span v-else :class="['money-text__coin', {'money-text__coin--after-text': part.spaceBefore, 'money-text__coin--before-text': part.spaceAfter}]">
      <ButtonCount :part="{kind: 'megacredits', value: part.value, printed}"/>
    </span>
  </template>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {moneyParts} from '@/client/components/common/moneyText';
import ButtonCount from '@/client/components/common/ButtonCount.vue';

const props = defineProps<{
  // Already translated text
  text: string,
  // Price before discounts of the amounts in the text: shown like on a project card (ButtonCount.vue)
  printed?: number,
}>();

type Part = {kind: 'text', text: string} | {kind: 'coin', value: number, spaceBefore: boolean, spaceAfter: boolean};

const parts = computed((): Array<Part> => {
  const split = moneyParts(props.text);
  return split.map((part, index) => {
    if (part.kind === 'text') {
      // The space next to a coin moves into the coin's margin
      const before = split[index - 1]?.kind === 'coin';
      const after = split[index + 1]?.kind === 'coin';
      let text = part.text;
      if (after) {
        text = text.replace(/\s+$/, '');
      }
      if (before) {
        text = text.replace(/^\s+/, '');
      }
      return {kind: 'text', text};
    }
    const previous = split[index - 1];
    const next = split[index + 1];
    return {
      kind: 'coin',
      value: part.value,
      spaceBefore: previous?.kind === 'text' && /\s$/.test(previous.text),
      spaceAfter: next?.kind === 'text' && /^\s/.test(next.text),
    };
  });
});
</script>
