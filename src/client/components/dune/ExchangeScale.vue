<template>
  <!-- Rate scale of one tile of the smuggling trade (exchangeScale.ts, Jens 22 Oct 2026): the five possible rates,
       normal framed, current gold; the ends say which side is good, the line below how far the rate is from normal -->
  <!-- Solari always stand at 1: only the coin and "fixed" -->
  <span v-if="resource === SOLARI" class="exchange-scale exchange-scale--fixed">
    <span class="button-count button-count--megacredits">1</span>
    <span class="exchange-scale__verdict">{{ $t('fixed') }}</span>
  </span>
  <span v-else :class="['exchange-scale', 'exchange-scale--' + scale.mood]" data-test="exchange-scale">
    <span class="exchange-scale__steps">
      <span v-for="(step, index) in scale.steps" :key="index"
        :class="['exchange-scale__step', 'exchange-scale__step--' + step.mood,
          {'exchange-scale__step--normal': step.normal, 'exchange-scale__step--current': step.current}]">{{ step.rate ?? '–' }}</span>
    </span>
    <span class="exchange-scale__legend"><span>{{ $t(scale.legend[0]) }}</span><span>{{ $t(scale.legend[1]) }}</span></span>
    <span class="exchange-scale__verdict">{{ verdict }}</span>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Resource} from '@/common/Resource';
import {ExchangeBoardModel} from '@/common/dune/smugglingExchange';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {rateScale} from './exchangeScale';

const props = defineProps<{
  resource: Resource,
  board: ExchangeBoardModel,
  // Selling (you give): a high rate is good; buying (you get): a low one
  higherIsGood: boolean,
}>();

const SOLARI = Resource.MEGACREDITS;
const scale = computed(() => rateScale(props.board, props.resource, props.higherIsGood));
const verdict = computed(() => scale.value.mood === 'normal' ?
  translateText(scale.value.verdict) :
  translateTextWithParams(scale.value.verdict, [String(scale.value.deviation)]));
</script>
