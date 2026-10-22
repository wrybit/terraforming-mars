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
    <!-- One line per effect: value and reason. The acting player is implied by the log row,
         only other players (or "All players") get their name in front -->
    <div v-for="(item, index) in items" :key="'effect' + index" class="log-action-effects-line">
      <span v-if="!isActing(item.player)" :class="['log-action-effects-player', item.player !== undefined ? 'player_bg_color_' + item.player : 'log-action-effects-player--all']">{{ item.player !== undefined ? playerName(item.player) : $t('All players') }}</span>
      <LogEffectIcon :effect="item.effect"/>
      <span v-if="reason(item.effect) !== ''" class="log-action-effects-note">{{ reason(item.effect) }}</span>
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
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
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
    // Flat list, one line per effect with its player
    items(): Array<{player?: Color, effect: LogEffect}> {
      return this.lines.flatMap((line) => line.effects.map((effect) => ({player: line.player, effect})));
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
    // Why the value changed: the card it lies on, the card or rule that caused it, or what the icon stands for
    reason(effect: LogEffect): string {
      if (effect.card !== undefined) {
        return this.note('on ${0}', effect.card);
      }
      if (effect.cause !== undefined) {
        return this.note('because of ${0}', effect.cause);
      }
      if (effect.label !== undefined) {
        return translateText(effect.label);
      }
      if (!effect.cost) {
        return '';
      }
      return translateText(this.action.kind === 'card' ? 'paid for the card' : 'for the trade');
    },
    isActing(player: Color | undefined): boolean {
      return player !== undefined && player === this.action.player;
    },
    slug(party: string): string {
      return partySlug(party);
    },
  },
});
</script>
