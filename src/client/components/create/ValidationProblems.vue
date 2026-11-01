<template>
  <!-- Directly under the Create button instead of a popup: errors (block creating) and warnings each in their own box -->
  <div class="create-game-validation">
    <template v-for="group in groups" :key="group.tone">
      <section v-if="group.problems.length > 0" :class="['create-game-validation-box', `create-game-validation-box--${group.tone}`]">
        <h3 class="create-game-validation-title"><span aria-hidden="true">&#9888;&#xFE0E;</span><span v-i18n>{{ group.title }}</span></h3>
        <!-- Plain paragraphs, no bullets; affected cards etc. as a comma separated line below -->
        <div class="create-game-validation-problems">
          <p v-for="problem in group.problems" :key="problem.key">
            <span>{{ problem.text }}</span>
            <template v-if="problem.learnMore">&nbsp;<a :href="problem.learnMore" target="_blank" v-i18n>Learn more</a></template>
            <span v-if="problem.items.length > 0" class="create-game-validation-items">{{ problem.items.map((item) => $t(item)).join(', ') }}</span>
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {validationDetails, ValidationErrors} from '@/common/game/validateNewGameConfig';
import {translateMessage, translateText} from '@/client/directives/i18n';
import {WIKI_URLS} from '@/client/utils/WikiLinks';
import {partition} from '@/common/utils/utils';
import {boxProblemKeys} from './validationProblemKeys';

type Problem = {
  key: keyof ValidationErrors,
  text: string,
  items: ReadonlyArray<string>,
  learnMore: string | undefined,
  blocking: boolean,
};

// Wiki pages that explain a validation problem in more detail.
const learnMoreUrls: Partial<Record<keyof ValidationErrors, string>> = {
  maybeNotEnoughPreludes: WIKI_URLS.customPreludes,
};

const props = defineProps<{
  errors: ValidationErrors;
}>();

const problems = computed((): Array<Problem> => {
  const result: Array<Problem> = [];
  for (const key of boxProblemKeys(props.errors)) {
    const value = props.errors[key];
    const {message} = validationDetails[key];
    const text = typeof message === 'string' ? translateText(message) : translateMessage(message(props.errors));
    const items = Array.isArray(value) ? value : [];
    result.push({key, text, items, learnMore: learnMoreUrls[key], blocking: validationDetails[key].blocking});
  }
  return result;
});

/** Groups the validation results by warning or error. */
const groups = computed(() => {
  const [errors, warnings] = partition(problems.value, (problem) => problem.blocking);
  return [
    {tone: 'error', title: 'Errors', problems: errors},
    {tone: 'warning', title: 'Warnings', problems: warnings},
  ];
});
</script>
