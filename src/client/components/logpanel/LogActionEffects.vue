<template>
  <!-- Compact summary of an action under the hover preview: per player what changed, and on which card or through which card -->
  <div class="log-action-effects" data-test="log-action-effects">
    <div class="log-action-effects-title">{{ $t('Effects') }}</div>
    <div v-for="line in lines" :key="line.player" class="log-action-effects-line">
      <span :class="['log-action-effects-player', 'player_bg_color_' + line.player]">{{ playerName(line.player) }}</span>
      <span v-for="(effect, index) in line.effects" :key="index" class="log-action-effects-item">
        <LogEffectIcon :effect="effect"/>
        <span v-if="effect.card !== undefined" class="log-action-effects-note">{{ note('on ${0}', effect.card) }}</span>
        <span v-else-if="effect.cause !== undefined" class="log-action-effects-note">{{ note('because of ${0}', effect.cause) }}</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {LogAction, LogEffect} from '@/client/components/logpanel/logActions';
import LogEffectIcon from '@/client/components/logpanel/LogEffectIcon.vue';

export default defineComponent({
  name: 'LogActionEffects',
  components: {LogEffectIcon},
  props: {
    action: {
      type: Object as PropType<LogAction>,
      required: true,
    },
    players: {
      type: Array as PropType<Array<PublicPlayerModel>>,
      required: true,
    },
  },
  computed: {
    // The acting player first, then everyone else the action changed something for
    lines(): Array<{player: Color, effects: ReadonlyArray<LogEffect>}> {
      const own = this.action.effects.length > 0 ? [{player: this.action.player, effects: this.action.effects}] : [];
      return [...own, ...this.action.others];
    },
  },
  methods: {
    playerName(color: Color): string {
      return this.players.find((player) => player.color === color)?.name ?? color;
    },
    note(template: string, card: CardName): string {
      return translateTextWithParams(template, [translateText(card.split(':')[0])]);
    },
  },
});
</script>
