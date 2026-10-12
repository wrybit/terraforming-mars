<template>
  <!-- Compact summary of an action under the hover preview: per player what changed, and on which card or through which card -->
  <div class="log-action-effects" data-test="log-action-effects">
    <div class="log-action-effects-title">{{ $t('Effects') }}</div>
    <!-- Text lines the row stands for (turmoil: chairman, ruling bonus and policy) -->
    <div v-for="(note, index) in notes" :key="'note' + index" class="log-action-effects-text">{{ note }}</div>
    <div v-if="parties.length > 0" class="log-action-effects-line">
      <span class="log-action-effects-note">{{ $t('Neutral delegates') }}</span>
      <span v-for="(party, index) in parties" :key="index" class="log-row-party"><i :class="['log-row-party-icon', 'log-row-party-icon--' + slug(party)]"></i>{{ $t(party) }}</span>
    </div>
    <div v-for="line in lines" :key="line.player ?? 'all'" class="log-action-effects-line">
      <span :class="['log-action-effects-player', line.player !== undefined ? 'player_bg_color_' + line.player : 'log-action-effects-player--all']">{{ line.player !== undefined ? playerName(line.player) : $t('All players') }}</span>
      <span v-for="(effect, index) in line.effects" :key="index" class="log-action-effects-item">
        <LogEffectIcon :effect="effect"/>
        <span v-if="effect.card !== undefined" class="log-action-effects-note">{{ note('on ${0}', effect.card) }}</span>
        <span v-else-if="effect.cause !== undefined" class="log-action-effects-note">{{ note('because of ${0}', effect.cause) }}</span>
        <span v-else-if="effect.label !== undefined" class="log-action-effects-note">{{ $t(effect.label) }}</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {LogAction, LogEffect} from '@/client/components/logpanel/logActions';
import {partySlug} from '@/client/components/logpanel/logCardType';
import LogEffectIcon from '@/client/components/logpanel/LogEffectIcon.vue';

// Whether an action has anything to show in the summary
export function hasActionSummary(action: LogAction | undefined): boolean {
  return action !== undefined && (action.effects.length + action.others.length + (action.everyone ?? []).length +
    (action.notes ?? []).length + (action.parties ?? []).length) > 0;
}

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
    // The acting player first, then all players at once, then everyone else the action changed something for
    lines(): Array<{player?: Color, effects: ReadonlyArray<LogEffect>}> {
      const own = this.action.effects.length > 0 ? [{player: this.action.player, effects: this.action.effects}] : [];
      const everyone = (this.action.everyone ?? []).length > 0 ? [{player: undefined, effects: this.action.everyone ?? []}] : [];
      return [...own, ...everyone, ...this.action.others];
    },
    parties(): ReadonlyArray<string> {
      return this.action.parties ?? [];
    },
    // Server lines as translated text: players by name, everything else translated
    notes(): Array<string> {
      return (this.action.notes ?? []).map((message) => translateTextWithParams(message.message, message.data.map((datum) =>
        datum.type === LogMessageDataType.PLAYER ? this.playerName(datum.value as Color) : translateText(String(datum.value)))));
    },
  },
  methods: {
    playerName(color: Color | undefined): string {
      return this.players.find((player) => player.color === color)?.name ?? color ?? '';
    },
    note(template: string, name: string): string {
      return translateTextWithParams(template, [translateText(name.split(':')[0])]);
    },
    slug(party: string): string {
      return partySlug(party);
    },
  },
});
</script>
