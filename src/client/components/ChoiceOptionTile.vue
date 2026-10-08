<template>
  <!-- One option of a simple decision (choiceMenu.ts) as a tile; the selected one pulses like cards.
       If the option names a resource (e.g. Robinson Industries: "Increase steel production 1 step"), the
       tile shows its icon and the player's own amount before → after (selectPlayerResource.ts), so the
       options can be told apart by image, not just text. Resources on a card (e.g. Nitrite Reducing Bacteria:
       "Remove 3 microbes …" / "Add 1 microbe …", cardResourceEffect.ts) show the card resource icon with the
       amount and the count on the card before → after. Options that pay one resource for another
       (Electro Catapult: "Spend 1 plant to gain 7 M€") list every affected resource with stock and
       production, so the rest after paying is visible too. Structure like PlayerOptionTile.vue. -->
  <label :class="['choice-option', {'choice-option--selected': selected, 'choice-option--resource': hasIcon}]">
    <!-- Radio for keyboard and screen readers; the tile is what is visible -->
    <input type="radio" :name="groupName" :checked="selected" class="choice-option-input" @change="$emit('select')">
    <!-- Icons in title order: what is paid → what is gained (Electro Catapult: plant → M€, steel → M€),
         so options with the same result can be told apart at a glance -->
    <span v-if="hasIcon" class="choice-option-icons">
      <template v-for="(group, groupIndex) in iconGroups" :key="groupIndex">
        <span v-if="groupIndex > 0" class="choice-option-arrow">→</span>
        <template v-for="(item, itemIndex) in group" :key="itemIndex">
          <template v-if="item.card !== undefined">
            <span v-if="item.card.amount !== undefined" :class="['choice-option-amount', 'choice-option-amount--' + item.card.direction]">{{ signedAmount(item.card) }}</span>
            <i :class="['choice-option-icon', cardResourceCSS[item.card.resource]]"></i>
          </template>
          <i v-else :class="'resource_icon choice-option-icon resource_icon--' + item.resource"></i>
        </template>
      </template>
    </span>
    <span>{{ $t(title) }}</span>
    <!-- Own values of every affected resource: stock and production, the changed one before → after -->
    <div v-if="cardCount !== undefined || changes.length > 0" class="choice-option-value">
      <div v-if="cardCount !== undefined" class="choice-option-card-count">
        <span class="choice-option-value-label">{{ $t('On card') }}</span>
        {{ cardCount.before }}<span v-if="cardCount.after !== cardCount.before" :class="['choice-option-after', 'choice-option-after--' + cardEffect?.direction]">→{{ cardCount.after }}</span>
      </div>
      <div v-if="changes.length > 0" class="choice-option-table">
        <span></span>
        <span class="choice-option-value-label">{{ $t('Stock') }}</span>
        <span class="choice-option-value-label">{{ $t('Production') }}</span>
        <template v-for="change in changes" :key="change.resource">
          <i :class="'resource_icon choice-option-row-icon resource_icon--' + change.resource"></i>
          <span class="choice-option-number">
            {{ change.before.stock }}<span v-if="change.after.stock !== change.before.stock" :class="afterClass(change.after.stock, change.before.stock)">→{{ change.after.stock }}</span>
          </span>
          <span class="choice-option-number">
            {{ signed(change.before.production) }}<span v-if="change.after.production !== change.before.production" :class="afterClass(change.after.production, change.before.production)">→{{ signed(change.after.production) }}</span>
          </span>
        </template>
      </div>
    </div>
  </label>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Message} from '@/common/logs/Message';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {playerEffects, resourceChanges} from '@/client/components/selectPlayerResource';
import {Resource} from '@/common/Resource';
import {cardResourceCount, cardResourceEffect, CardResourceEffect} from '@/client/components/cardResourceEffect';
import {cardResourceCSS} from '@/client/components/common/cardResources';

const props = defineProps<{
  title: string | Message;
  // Player whose amounts the tile shows (one's own); without a player only icon and text
  player?: PublicPlayerModel;
  // Card that triggers the decision: "this card" in the option title refers to it
  sourceCard?: CardName;
  selected: boolean;
  groupName: string;
}>();

defineEmits<{
  (event: 'select'): void;
}>();

// Card resources take precedence: "Remove 2 microbes to gain 3 plants" is first of all about the microbes
const cardEffect = computed(() => cardResourceEffect(props.title, props.sourceCard));
const cardCount = computed(() => cardEffect.value === undefined || props.player === undefined ? undefined : cardResourceCount(cardEffect.value, props.player.tableau ?? []));
// Own standard resources the option changes (cost and result); left out if the card resource already
// carries the cost, e.g. "Remove 2 microbes to gain 3 plants" still shows the plants
const effects = computed(() => playerEffects(props.title));
const changes = computed(() => props.player === undefined ? [] : resourceChanges(props.player, effects.value));

type IconItem = {card?: CardResourceEffect, resource?: Resource};
// Paid resources first, then the rest, separated by an arrow; without a cost just one group
const iconGroups = computed(() => {
  const items: Array<IconItem & {direction?: 'gain' | 'loss'}> = [];
  if (cardEffect.value !== undefined) {
    items.push({card: cardEffect.value, direction: cardEffect.value.direction});
  }
  for (const effect of effects.value) {
    if (!items.some((item) => item.resource === effect.resource)) {
      items.push({resource: effect.resource, direction: effect.direction});
    }
  }
  const cost = items.filter((item) => item.direction === 'loss');
  const rest = items.filter((item) => item.direction !== 'loss');
  // Only a loss (e.g. "Decrease energy production") is not a cost: one group
  return [cost, rest].filter((group) => group.length > 0);
});
const hasIcon = computed(() => iconGroups.value.length > 0);

// Production with sign as in the player bars (+2, 0, -1)
function signed(value: number): string {
  return value > 0 ? '+' + value : String(value);
}

// Value afterwards green when it rises, red when it falls
function afterClass(after: number, before: number): Array<string> {
  return ['choice-option-after', after > before ? 'choice-option-after--gain' : 'choice-option-after--loss'];
}

// Amount next to the card resource icon: +1 for adding, −3 for removing, plain number if the direction is open
function signedAmount(cardResource: CardResourceEffect): string {
  const amount = String(cardResource.amount ?? '');
  if (cardResource.direction === 'gain') {
    return '+' + amount;
  }
  return cardResource.direction === 'loss' ? '−' + amount : amount;
}
</script>
