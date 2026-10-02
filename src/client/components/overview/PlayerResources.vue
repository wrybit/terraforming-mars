<template>
  <div class="resource_items_cont">
    <!-- Goods with value and protection from playerGoods.ts (shared with the table) -->
    <PlayerResource v-for="good in goods" :key="good.type"
      :type="good.type"
      :count="good.count"
      :production="good.production"
      :value="good.value"
      :resourceProtection="good.resourceProtection"
      :productionProtection="good.productionProtection"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import PlayerResource from '@/client/components/overview/PlayerResource.vue';
import {PlayerGood, playerGoods} from '@/client/components/overview/playerGoods';

export default defineComponent({
  name: 'PlayerResources',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
  },
  computed: {
    goods(): Array<PlayerGood> {
      return playerGoods(this.player);
    },
  },
  components: {
    PlayerResource,
  },
});
</script>
