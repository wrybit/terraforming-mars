<template>
  <!-- A player as a tile in their color; the selected one pulses like cards (player_options.less).
       If a resource is involved, the tile shows its stock and production, and for the affected value
       also the amount afterwards (selectPlayerResource.ts). Shared by SelectPlayer.vue and the
       tile decision in OrOptions.vue (there also for options like "Remove 4 steel from …"). -->
  <label :class="['player-option', 'player_translucent_bg_color_' + color, {'player-option--selected': selected}]"
    :title="caption === undefined ? undefined : $t(caption)">
    <!-- Radio for keyboard and screen readers; the tile is what's visible -->
    <input type="radio" :name="groupName" :value="color" :checked="selected" class="player-option-input" @change="$emit('select', color)">
    <SelectPlayerRow class="player-option-name" :player="player"/>
    <div v-if="snapshot !== undefined && after !== undefined" class="player-option-resource">
      <i :class="'resource_icon player-option-icon resource_icon--' + effect?.resource"></i>
      <div class="player-option-values">
        <div class="player-option-value">
          <div class="player-option-label" v-i18n>Stock</div>
          {{ snapshot.stock }}<span v-if="after.stock !== snapshot.stock" class="player-option-after">→{{ after.stock }}</span>
        </div>
        <div class="player-option-value">
          <div class="player-option-label" v-i18n>Production</div>
          {{ signed(snapshot.production) }}<span v-if="after.production !== snapshot.production" class="player-option-after">→{{ signed(after.production) }}</span>
        </div>
      </div>
    </div>
  </label>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ColorWithNeutral} from '@/common/Color';
import {Message} from '@/common/logs/Message';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import SelectPlayerRow from '@/client/components/SelectPlayerRow.vue';
import {PlayerEffect, ResourceSnapshot, resourceAfter, resourceSnapshot} from '@/client/components/selectPlayerResource';

export default defineComponent({
  name: 'PlayerOptionTile',
  components: {
    SelectPlayerRow,
  },
  props: {
    color: {
      type: String as () => ColorWithNeutral,
      required: true,
    },
    player: {
      type: Object as () => PublicPlayerModel | undefined,
      required: false,
      default: undefined,
    },
    // What the choice changes for the player; without a resource the tile shows just the name
    effect: {
      type: Object as () => PlayerEffect | undefined,
      required: false,
      default: undefined,
    },
    // Full option text (e.g. "Remove 4 steel from …") as tooltip; visible are name, icon and before → after,
    // so the name isn't shown twice
    caption: {
      type: [String, Object] as unknown as () => string | Message | undefined,
      required: false,
      default: undefined,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      required: true,
    },
  },
  emits: ['select'],
  computed: {
    // Stock and production of the affected resource; undefined if no resource is involved
    snapshot(): ResourceSnapshot | undefined {
      if (this.effect === undefined || this.player === undefined) {
        return undefined;
      }
      return resourceSnapshot(this.player, this.effect.resource);
    },
    after(): ResourceSnapshot | undefined {
      if (this.snapshot === undefined || this.effect === undefined) {
        return undefined;
      }
      return resourceAfter(this.snapshot, this.effect);
    },
  },
  methods: {
    // Production with sign, as in the player bars (+2, 0, -1)
    signed(value: number): string {
      return value > 0 ? '+' + value : String(value);
    },
  },
});
</script>
