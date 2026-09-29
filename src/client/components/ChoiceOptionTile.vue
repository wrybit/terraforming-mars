<template>
  <!-- Eine Option einer einfachen Entscheidung (choiceMenu.ts) als Kachel; die gewählte pulsiert wie Karten.
       Nennt die Option eine Ressource (z. B. Robinson Industries: "Erhöhe Stahl-Produktion um 1"), zeigt die
       Kachel deren Symbol und den eigenen Stand vorher → nachher (selectPlayerResource.ts), damit man die
       Optionen am Bild statt nur am Text unterscheidet. Aufbau wie PlayerOptionTile.vue. -->
  <label :class="['choice-option', {'choice-option--selected': selected, 'choice-option--resource': effect !== undefined}]">
    <!-- Radio für Tastatur und Screenreader, sichtbar ist die Kachel -->
    <input type="radio" :name="groupName" :checked="selected" class="choice-option-input" @change="$emit('select')">
    <i v-if="effect !== undefined" :class="'resource_icon choice-option-icon resource_icon--' + effect.resource"></i>
    <span>{{ $t(title) }}</span>
    <div v-if="snapshot !== undefined && after !== undefined" class="choice-option-value">
      <span class="choice-option-value-label">{{ $t(effect?.target === 'production' ? 'Production' : 'Stock') }}</span>
      <template v-if="effect?.target === 'production'">
        {{ signed(snapshot.production) }}<span v-if="after.production !== snapshot.production" :class="['choice-option-after', 'choice-option-after--' + effect?.direction]">→{{ signed(after.production) }}</span>
      </template>
      <template v-else>
        {{ snapshot.stock }}<span v-if="after.stock !== snapshot.stock" :class="['choice-option-after', 'choice-option-after--' + effect?.direction]">→{{ after.stock }}</span>
      </template>
    </div>
  </label>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Message} from '@/common/logs/Message';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {playerEffect, resourceAfter, resourceSnapshot} from '@/client/components/selectPlayerResource';

const props = defineProps<{
  title: string | Message;
  // Spieler, dessen Stand die Kachel zeigt (der eigene); ohne Spieler nur Symbol und Text
  player?: PublicPlayerModel;
  selected: boolean;
  groupName: string;
}>();

defineEmits<{
  (event: 'select'): void;
}>();

const effect = computed(() => playerEffect(props.title));
const snapshot = computed(() => effect.value === undefined || props.player === undefined ? undefined : resourceSnapshot(props.player, effect.value.resource));
const after = computed(() => snapshot.value === undefined || effect.value === undefined ? undefined : resourceAfter(snapshot.value, effect.value));

// Produktion mit Vorzeichen wie in den Spielerleisten (+2, 0, -1)
function signed(value: number): string {
  return value > 0 ? '+' + value : String(value);
}
</script>
