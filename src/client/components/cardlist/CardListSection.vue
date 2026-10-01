<template>
  <section class="card-list-section">
    <div class="card-list-section-head">
      <span class="card-list-section-stripe">
        <span v-for="part in presentParts" :key="part.colorClass" :class="part.colorClass"></span>
      </span>
      <h2 v-i18n>{{ title }}</h2>
      <span v-if="presentParts.length > 1" class="card-list-section-legend">
        <span v-for="part in presentParts" :key="part.colorClass">
          <span class="card-list-dot" :class="part.colorClass"></span><span v-i18n>{{ part.label }}</span> {{ part.count }}
        </span>
      </span>
      <span class="card-list-section-count">{{ count }}</span>
    </div>
    <div class="card-list-section-body">
      <slot></slot>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {SectionPart} from '@/client/components/cardlist/cardListOptions';

// Abschnitt der Kartenliste: Kopf als Milchglas-Leiste, links ein Farbstreifen aus den Farben der enthaltenen
// Kartentypen, bei mehreren Typen eine kleine Legende, rechts die Anzahl. Der Kopf bleibt beim Scrollen stehen.
export default defineComponent({
  name: 'CardListSection',
  props: {
    title: {type: String, required: true},
    count: {type: Number, required: true},
    parts: {type: Array as PropType<ReadonlyArray<SectionPart>>, required: true},
  },
  computed: {
    presentParts(): Array<SectionPart> {
      return this.parts.filter((part) => part.count > 0);
    },
  },
});
</script>
