<template>
    <div class="card-extra-content-container">
      <!-- Search For Life after a find: the found microbe glowing on the greyed card, below it the two-line hint -->
      <div v-if="foundLifeImage !== undefined" class="found-life">
        <img class="found-life__microbe" :src="foundLifeImage" alt="">
        <p class="found-life__hint">
          <span v-i18n>Life found.</span><span class="found-life__check" aria-hidden="true">✔</span><br>
          <span class="found-life__warning" v-i18n>No further VP possible!</span>
        </p>
      </div>
      <div v-if="isMiningTileOnSteel()" class="mined-metal mined-steel" ></div>
      <div v-if="isMiningTileOnTitanium()" class="mined-metal mined-titanium" ></div>
    </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {Resource} from '@/common/Resource';
import {foundLifeImage} from '@/common/cards/foundLife';

export default defineComponent({
  name: 'CardExtraContent',
  props: {
    card: {
      type: Object as () => CardModel,
      required: true,
    },
  },
  computed: {
    foundLifeImage(): string | undefined {
      const variant = this.card.foundLifeVariant;
      return variant === undefined ? undefined : foundLifeImage(variant);
    },
  },
  methods: {
    isMiningTileOnSteel() {
      return this.card.name !== CardName.SPECIALIZED_SETTLEMENT && this.card.bonusResource?.includes(Resource.STEEL);
    },
    isMiningTileOnTitanium() {
      return this.card.name !== CardName.SPECIALIZED_SETTLEMENT && this.card.bonusResource?.includes(Resource.TITANIUM);
    },
  },
});

</script>

