<template>
  <div v-if="space !== undefined" :class="mainClass" :data_space_id="space.id" v-flash="flashKeys.marsSpace(space.id)" data-flash-shape="hex">
    <BoardSpaceTile
      :space="space"
      :aresExtension="aresExtension"
      :tileView="tileView"
    />
    <div class="board-space-text" v-if="text" v-i18n>{{ text }}</div>
    <Bonus :bonus="space.bonus" v-if="showBonus"/>
    <div v-if="tileView === 'coords' && space.a9 !== undefined" class="board-space-coords">{{ space.a9 }}</div>
    <template v-if="showTiles">
      <BoardCube v-if="space.color !== undefined" class="board-cube" :color="space.color" :spinSeed="space.id"/>
      <template v-if="space.gagarin !== undefined">
        <div v-if="space.gagarin === 0" class='gagarin'></div>
        <div v-else class='gagarin visited'></div>
      </template>
      <template v-if="space.cathedral === true">
        <div class='board-cube--cathedral'></div>
      </template>
      <template v-if="space.nomads === true">
        <div class='board-cube--nomad'></div>
      </template>
      <BoardSpaceCube v-if="space.cube !== undefined" :cube="space.cube"/>
      <!-- Dune expansion: the worm marker (nothing may be placed under it) -->
      <div v-if="space.worm === true" class="board-space-worm" :title="$t('Shai-Hulud: nothing may be placed here')"></div>
      <div v-if="space.warField === true" class="board-space-war-field" :title="$t('War field of the Kanly')"></div>
      <UndergroundToken v-if="claimedToken !== undefined" :token="claimedToken" location="board"/>
      <div v-if="space.excavator !== undefined" class="underground-excavator" :class="'underground-excavator--' + space.excavator"></div>
      <div v-if="space.spaceType === SpaceType.DEFLECTION_ZONE" class="board-space-type-deflection-zone"></div>
    </template>
    <div class="board-log-highlight" :data_log_highlight_id="space.id"></div>
    </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import Bonus from '@/client/components/Bonus.vue';
import BoardCube from '@/client/components/common/BoardCube.vue';
import BoardSpaceTile from '@/client/components/board/BoardSpaceTile.vue';
import BoardSpaceCube from '@/client/components/board/BoardSpaceCube.vue';
import UndergroundToken from '@/client/components/underworld/UndergroundToken.vue';
import {TileView, showsTiles} from '@/client/components/board/TileView';
import {SpaceModel} from '@/common/models/SpaceModel';
import {ClaimedToken} from '@/common/underworld/UnderworldPlayerData';
import {SpaceType} from '@/common/boards/SpaceType';
import {vFlash} from '@/client/directives/ChangeFlash';
import {flashKeys} from '@/client/utils/changeFlashKeys';
export default defineComponent({
  name: 'BoardSpace',
  props: {
    space: {
      type: Object as () => SpaceModel,
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    aresExtension: {
      type: Boolean,
    },
    tileView: {
      type: String as () => TileView,
      required: true,
    },
  },
  directives: {
    flash: vFlash,
  },
  components: {
    Bonus,
    BoardSpaceTile,
    BoardSpaceCube,
    BoardCube,
    UndergroundToken,
  },
  computed: {
    flashKeys(): typeof flashKeys {
      return flashKeys;
    },
    mainClass(): string {
      let css = 'board-space board-space-' + this.space?.id.toString();
      css += ' board-space-selectable';
      // Dune Stabiliser: its greenery is a special tile with the yellow border (theme-extra.css)
      if (this.space?.wormSpared === true) {
        css += ' board-space--worm-spared';
      }
      // Dune Kanly: the whole space of the war field gets a red outline (dune_worm.less)
      if (this.space?.warField === true) {
        css += ' board-space--war-field';
      }
      return css;
    },
    showTiles(): boolean {
      return showsTiles(this.tileView);
    },
    showBonus(): boolean {
      if (!this.showTiles) {
        return true;
      }
      return this.space.tileType === undefined && this.space.cube === undefined;
    },
    claimedToken(): ClaimedToken | undefined {
      if (this.space.undergroundResource === undefined) {
        return undefined;
      }
      return {token: this.space.undergroundResource, shelter: false, active: false};
    },

    SpaceType(): typeof SpaceType {
      return SpaceType;
    },
  },
});

</script>

