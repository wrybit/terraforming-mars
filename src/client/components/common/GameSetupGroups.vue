<template>
  <div class="game-setup-groups">
    <div class="game-setup-groups__row">
      <section v-for="group in groups" :key="group.key" class="game-setup-group">
        <h3 class="game-setup-group__title" v-i18n>{{ group.title }}</h3>
        <GameSetupChips :chips="group.chips" compact/>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import GameSetupChips from '@/client/components/common/GameSetupChips.vue';
import {GameSetupChip, groupSetupChips} from '@/client/components/common/gameSetupChips';

// Setup of a game sorted into the cards of the create form (results page), so the basis of the game reads at a glance.
// One root element without a comment before it, so classes passed in land on the group row.

const props = defineProps<{
  chips: ReadonlyArray<GameSetupChip>;
}>();

const groups = computed(() => groupSetupChips(props.chips));
</script>
