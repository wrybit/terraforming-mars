<template>
  <!-- What an action changed, right-aligned as a column: own effects, then all players, then other players.
       Shared by the action rows (LogActionRow.vue) and text lines that trigger effects (LogMessageComponent.vue) -->
  <span class="log-row-effects">
    <LogEffectIcon v-for="(effect, index) in action.effects" :key="'own' + index" :effect="effect" @spaceClicked="$emit('spaceClicked', $event)"/>
    <!-- All players at once (turmoil phase): same area as for other players -->
    <span v-if="(action.everyone ?? []).length > 0" :class="['log-row-other', isLoss(action.everyone ?? []) ? 'log-row-other--loss' : 'log-row-other--gain']">
      <span class="log-row-other-name">{{ $t('All players') }}</span>
      <LogEffectIcon v-for="(effect, index) in action.everyone" :key="index" :effect="effect"/>
    </span>
    <!-- Other players: red area = something was taken from them, green area = they got something -->
    <span v-for="other in action.others" :key="other.player"
      :class="['log-row-other', isLoss(other.effects) ? 'log-row-other--loss' : 'log-row-other--gain']">
      <span class="log-row-other-name">{{ playerName(other.player) }}</span>
      <LogEffectIcon v-for="(effect, index) in other.effects" :key="index" :effect="effect" @spaceClicked="$emit('spaceClicked', $event)"/>
    </span>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {ViewModel} from '@/common/models/PlayerModel';
import {LogAction, LogEffect} from '@/client/components/logpanel/logActions';
import LogEffectIcon from '@/client/components/logpanel/LogEffectIcon.vue';

export default defineComponent({
  name: 'LogRowEffects',
  components: {LogEffectIcon},
  props: {
    action: {
      type: Object as PropType<LogAction>,
      required: true,
    },
    viewModel: {
      type: Object as PropType<ViewModel>,
      required: true,
    },
  },
  emits: ['spaceClicked'],
  methods: {
    playerName(color: Color): string {
      return this.viewModel.players.find((player) => player.color === color)?.name ?? color;
    },
    isLoss(effects: ReadonlyArray<LogEffect>): boolean {
      return effects.some((effect) => effect.amount < 0);
    },
  },
});
</script>
