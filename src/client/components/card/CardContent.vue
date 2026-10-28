<template>
  <div class="card-content" :class="corporationClass">
    <CardRequirementsComponent v-if="requirements !== undefined && requirements.length > 0" :requirements="requirements"/>
    <CardDescription v-if="!isCorporation && hasDescription && leadsWithDescription" :item="metadata.description"/>
    <CardRenderData v-if="firstRow !== undefined" :renderData="firstRow" />
    <CardDescription v-if="isCorporation && hasDescription" :item="metadata.description"/>
    <CardRenderData v-if="remainingRows !== undefined" :renderData="remainingRows" />
    <CardDescription v-if="!isCorporation && hasDescription && !leadsWithDescription" :item="metadata.description"/>
    <div :class="'bottom-padding-' + bottomPadding" v-if="bottomPadding"></div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {CardMetadata} from '@/common/cards/CardMetadata';
import CardRequirementsComponent from './CardRequirementsComponent.vue';
import CardDescription from './CardDescription.vue';
import CardRenderData from './CardRenderData.vue';
import {CardRequirementDescriptor} from '@/common/cards/CardRequirementDescriptor';
import {ICardRenderRoot, isICardRenderRoot, ItemType} from '@/common/cards/render/Types';
import {activeTheme} from '@/client/theme/applyTheme';
import {joinAlternativeRows} from './alternativeRows';
import {signGainRows} from './signedGainRows';
import {isDescription} from '@/common/cards/render/CardRenderDescription';

export default defineComponent({
  name: 'CardContent',
  props: {
    metadata: {
      type: Object as () => CardMetadata,
      required: true,
    },
    requirements: {
      type: Array as () => ReadonlyArray<CardRequirementDescriptor>,
      required: false,
    },
    isCorporation: {
      type: Boolean,
      required: true,
    },
    bottomPadding: {
      type: String, // '', 'short', 'long'
    },
  },
  components: {
    CardRequirementsComponent,
    CardDescription,
    CardRenderData,
  },
  methods: {
  },
  computed: {
    corporationClass(): string {
      return this.isCorporation ? 'card-content-corporation' : '';
    },
    hasDescription(): boolean {
      const description = this.metadata.description;
      return description !== undefined && (typeof(description) !== 'string' || description.length > 0);
    },
    // The text comes first when it is the only text of the card (CardRenderDescription.lead)
    leadsWithDescription(): boolean {
      return isDescription(this.metadata.description) && this.metadata.description.lead === true;
    },
    // Dune: alternatives in one row with a slash instead of OR (alternativeRows.ts) and a plus before gains next to a
    // loss (signedGainRows.ts); Mars keeps the rows of the card
    rows(): ReadonlyArray<Array<ItemType>> {
      if (!isICardRenderRoot(this.metadata.renderData)) {
        return [];
      }
      const rows = this.metadata.renderData.rows;
      return activeTheme() === 'dune' ? signGainRows(joinAlternativeRows(rows)) : rows;
    },
    firstRow(): ICardRenderRoot | undefined {
      if (this.rows.length > 0) {
        return {
          is: 'root',
          rows: [this.rows[0]],
        };
      }
      return undefined;
    },
    remainingRows(): ICardRenderRoot | undefined {
      if (this.rows.length > 1) {
        return {
          is: 'root',
          rows: this.rows.slice(1),
        };
      }
      return undefined;
    },
  },
});

</script>

