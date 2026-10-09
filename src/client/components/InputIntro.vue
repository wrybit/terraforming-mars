<template>
  <!-- Intro of an input in its tab box (WaitingForTabs): at the top of the box, or below the header row of a
       card list (tabPanelIntro.ts, `belowHeader`) -->
  <!-- Space selection etc.: tile, question and hint (tabIntro.ts); otherwise only the question -->
  <TabIntroBlock v-if="intro !== undefined" :intro="intro" :title="introTitle" :playerView="playerView" :card="sourceCard"/>
  <!-- If a card triggers the input (Sabotage, Comet for Venus …): card, name and text instead of "Select an option" -->
  <CardIntroBlock v-else-if="sourceCard !== undefined" :card="sourceCard" :title="title"/>
  <!-- Draft repick: the explanation is no question, it moves small into the footer next to the button.
       Below a header row the plain question is a small caption -->
  <label v-else-if="!draftRepick" :class="belowHeader ? 'or-tab-panel-caption' : 'or-tab-panel-title'"><div>{{ $t(title) }}</div></label>
</template>

<script setup lang="ts">
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CardName} from '@/common/cards/CardName';
import {Message} from '@/common/logs/Message';
import {TabIntro} from '@/client/components/tabIntro';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import CardIntroBlock from '@/client/components/CardIntroBlock.vue';

defineProps<{
  intro: TabIntro | undefined;
  // Title next to the tile (the input's own title for the final greenery)
  introTitle: string | Message;
  // Question of the input
  title: string | Message;
  playerView: PlayerViewModel;
  sourceCard: CardName | undefined;
  draftRepick: boolean;
  belowHeader?: boolean;
}>();
</script>
