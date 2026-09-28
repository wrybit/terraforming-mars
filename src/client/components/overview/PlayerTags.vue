<template>
    <div class="player-tags">
        <div class="player-tags-main">
            <TagCount tag="vp" :count="hideVpCount ? '?' : player.victoryPointsBreakdown.total" :size="'big'" :type="'main'" />
            <div v-if="isEscapeVelocityOn" :class="tooltipCss" :data-tooltip="$t('Escape Velocity penalty')">
              <TagCount tag="escape" :count="escapeVelocityPenalty" :size="'big'" :type="'main'" :showWhenZero="true"/>
            </div>
            <TagCount tag="tr" :count="player.terraformRating" :size="'big'" :type="'main'"/>
            <TagCount v-if="player.handicap !== undefined" :tag="'handicap'" :count="player.handicap" :size="'big'" :type="'main'" :showWhenZero="true"/>
            <div class="tag-and-discount">
              <PlayerTagDiscount v-if="all.discount" :amount="all.discount" :color="player.color"  :data-test="'discount-all'"/>
              <TagCount tag="cards" :count="cardsInHandCount" :size="'big'" :type="'main'"/>
            </div>
        </div>
        <div class="player-tags-secondary">
          <div class="tag-count-container" v-for="tagDetail of tags" :key="tagDetail.name">
            <template v-if="tagDetail.name === SpecialTags.UNDERGROUND_TOKEN_COUNT">
              <div class="tag-and-discount">
              <TagCount :tag="tagDetail.name" :undergroundToken="player.underworldData.activeBonus" :count="tagDetail.count" :size="'big'" :type="'secondary'"/>
              </div>
            </template>
            <div v-else-if="tagDetail.name === 'separator'" class="tag-separator"></div>
            <template v-else-if="tagDetail.name === 'all'"></template>
            <div v-else class="tag-and-discount">
              <PlayerTagDiscount v-if="tagDetail.discount > 0" :color="player.color" :amount="tagDetail.discount" :data-test="'discount-' + tagDetail.name"/>
              <PointsPerTag :points="tagDetail"/>
              <TagCount :tag="tagDetail.name" :count="tagDetail.count" :size="'big'" :type="'secondary'"/>
            </div>
          </div>
        </div>
    </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import TagCount from '@/client/components/TagCount.vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {SpecialTags} from '@/client/cards/SpecialTags';
import PlayerTagDiscount from '@/client/components/overview/PlayerTagDiscount.vue';
import PointsPerTag from '@/client/components/overview/PointsPerTag.vue';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {TagDetail, TagDetails, buildTagDetails, isTagInGame, isVictoryPointCountHidden} from '@/client/components/overview/playerTagDetails';

export default defineComponent({
  name: 'PlayerTags',
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    hideZeroTags: {
      type: Boolean,
    },
    isTopBar: {
      type: Boolean,
      default: false,
    },
  },
  // Zählung, Rabatte und Punkte je Tag teilt sich die Leiste mit der Tabelle (playerTagDetails.ts)
  data(): TagDetails {
    return buildTagDetails(this.player, this.playerView);
  },

  components: {
    TagCount,
    PlayerTagDiscount,
    PointsPerTag,
  },
  computed: {
    cardsInHandCount(): number {
      return this.player.cardsInHandNbr ?? 0;
    },
    hideVpCount(): boolean {
      return isVictoryPointCountHidden(this.player, this.playerView);
    },
    isEscapeVelocityOn(): boolean {
      return this.playerView.game.gameOptions.escapeVelocity !== undefined;
    },
    escapeVelocityPenalty(): number {
      return this.player.victoryPointsBreakdown.escapeVelocity;
    },
    tooltipCss(): string {
      return 'tooltip tooltip-' + (this.isTopBar ? 'bottom' : 'top');
    },
    tags(): Array<TagDetail> {
      const concise = getPreferences().hide_zero_tags;
      return this.tagsInOrder.filter((entry) => {
        if (!isTagInGame(entry.name, this.playerView.game)) {
          return false;
        }

        if (entry.count === 0 && entry.discount === 0) {
          if (this.hideZeroTags || concise) {
            return false;
          }
        }
        return true;
      });
    },
    SpecialTags() {
      return SpecialTags;
    },
  },
});

</script>
