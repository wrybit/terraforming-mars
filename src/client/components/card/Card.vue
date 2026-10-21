<template>
  <div class="card-container filterDiv hover-hide-res" :class="cardClasses" :style="fitStyle">
      <!-- Dune theme: a scene of Arrakis fades in behind the lower part of the card -->
      <span v-if="sceneUrl !== undefined" class="card-scene" :style="{backgroundImage: `url(${sceneUrl})`}" aria-hidden="true"></span>
      <!-- Action used this generation: the player's cube lies on the card like at the table, seen from above,
           at a random angle per card -->
      <span v-if="showPlayerCube" class="card-player-cube"><PlayerCube :color="cubeColor" view="top" :size="22" :spin="cubeSpin"/></span>
      <div class="card-content-wrapper" v-i18n @mouseover="hovering = true" @mouseleave="hovering = false">
          <div v-if="!isStandardProject" class="card-cost-and-tags">
              <CardCost :amount="cost" :newCost="reducedCost" />
              <CardHelp v-if="helpText !== undefined" :name="card.name" :helpText="helpText" :hovering="hovering" />
              <CardTags :tags="tags" />
          </div>
          <CardTitle :title="card.name" :type="cardType"/>
          <CardContent
              :metadata="cardMetadata"
              :requirements="cardRequirements"
              :isCorporation="isCorporationCard"
              :bottomPadding="bottomPadding" />
      </div>
      <CardExpansion :expansion="cardExpansion" :isCorporation="isCorporationCard" :isResourceCard="isResourceCard" :compatibility="cardCompatibility" />
      <CardResourceCounter v-if="hasResourceType" :amount="resourceAmount" :type="resourceType" />
      <CardVictoryPoints v-if="cardMetadata.victoryPoints" :victoryPoints="cardMetadata.victoryPoints" />
      <CardExtraContent :card="card" />
      <slot></slot>
  </div>
</template>

<script lang="ts">

import {defineComponent, nextTick} from 'vue';
import {CARD_ROW_ZOOM, CardScrollSpace, cardScrollSpace, fittingRowZoom} from './cardFit';
import {activeTheme} from '@/client/theme/applyTheme';
import {Theme} from '@/common/theme/Theme';

import {CardModel} from '@/common/models/CardModel';
import CardTitle from './CardTitle.vue';
import CardResourceCounter from './CardResourceCounter.vue';
import CardCost from './CardCost.vue';
import CardExtraContent from './CardExtraContent.vue';
import CardExpansion from './CardExpansion.vue';
import CardTags from './CardTags.vue';
import CardVictoryPoints from './CardVictoryPoints.vue';
import CardContent from './CardContent.vue';
import CardHelp from './CardHelp.vue';
import {cardScene} from '@/client/theme/themeDisplay';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {CardType} from '@/common/cards/CardType';
import {CardMetadata} from '@/common/cards/CardMetadata';
import {Tag} from '@/common/cards/Tag';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {CardResource} from '@/common/CardResource';
import {getCardOrThrow} from '@/client/cards/ClientCardManifest';
import {ClientCard} from '@/common/cards/ClientCard';
import {Color} from '@/common/Color';
import {CardRequirementDescriptor} from '@/common/cards/CardRequirementDescriptor';
import {GameModule} from '@/common/cards/GameModule';


export default defineComponent({
  name: 'Card',
  components: {
    PlayerCube,
    CardTitle,
    CardHelp,
    CardResourceCounter,
    CardCost,
    CardExtraContent,
    CardExpansion,
    CardTags,
    CardContent,
    CardVictoryPoints,
  },
  props: {
    card: {
      type: Object as () => CardModel,
      required: true,
    },
    actionUsed: {
      type: Boolean,
      required: false,
      default: false,
    },
    robotCard: {
      type: Object as () => CardModel | undefined,
      required: false,
    },
    // Cube is only shown when actionUsed is true.
    cubeColor: {
      type: String as () => Color,
      required: false,
      default: 'neutral',
    },
    // When true, the card is automatically sized regardless of hover.
    autoTall: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      hovering: false,
      // Fixed per card instance: the cube keeps its angle while the card is shown
      cubeSpin: Math.round(Math.random() * 360),
      // Dune cards: zoom of the icon rows, less than CARD_ROW_ZOOM where the widest row would not fit (cardFit.ts)
      rowZoom: CARD_ROW_ZOOM,
      // Dune cards too full for their large icons and text: the scroll area of the content (cardFit.ts)
      scrollSpace: undefined as CardScrollSpace | undefined,
      // Each fitting run gets a number; a newer run stops an older one that is still waiting for the DOM
      fitRun: 0,
      resizeObserver: undefined as ResizeObserver | undefined,
      measuredSize: '',
    };
  },
  mounted() {
    // The card's own size changes when it becomes visible (tabs, setup columns) or is zoomed: fit again then.
    // Fitting changes only the content, never the card's size, so this cannot loop.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        const box = (this.$el as HTMLElement).getBoundingClientRect();
        const size = `${Math.round(box.width)}x${Math.round(box.height)}`;
        if (size !== this.measuredSize) {
          this.measuredSize = size;
          this.fitIntoCard();
        }
      });
      this.resizeObserver.observe(this.$el as HTMLElement);
    }
    // The theme stylesheet and the fonts load after the first cards: measure again once they are there
    const themeStylesheet = document.getElementById('theme-stylesheet-dune') as HTMLLinkElement | null;
    if (themeStylesheet !== null && themeStylesheet.sheet === null) {
      themeStylesheet.addEventListener('load', () => this.fitIntoCard(), {once: true});
    }
    document.fonts?.ready.then(() => this.fitIntoCard());
    this.fitIntoCard();
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  watch: {
    theme() {
      this.fitIntoCard();
    },
    'card.name'() {
      this.fitIntoCard();
    },
  },
  methods: {
    // Dune cards show their icons and text larger (theme-extra.css). A row too wide for the card gets a smaller
    // zoom; where the content does not fit above the scene strip, it scrolls inside the card, with room below the last
    // line. On Mars nothing changes.
    async fitIntoCard(): Promise<void> {
      const run = ++this.fitRun;
      this.rowZoom = CARD_ROW_ZOOM;
      this.scrollSpace = undefined;
      if (this.theme !== 'dune') {
        return;
      }
      await nextTick();
      if (run !== this.fitRun) {
        return;
      }
      const card = this.$el as HTMLElement;
      // House cards keep their icons at 100 % (theme-extra.css)
      if (!this.isCorporationCard) {
        this.rowZoom = fittingRowZoom(card);
        await nextTick();
        if (run !== this.fitRun) {
          return;
        }
      }
      this.scrollSpace = cardScrollSpace(card);
    },
  },
  computed: {
    theme(): Theme {
      return activeTheme();
    },
    fitStyle(): Record<string, string> | undefined {
      const style: Record<string, string> = {};
      if (this.rowZoom !== CARD_ROW_ZOOM) {
        style['--card-row-zoom'] = String(this.rowZoom);
      }
      if (this.scrollSpace !== undefined) {
        style['--card-content-height'] = this.scrollSpace.contentHeight + 'px';
        style['--card-scroll-space'] = this.scrollSpace.bottomSpace + 'px';
      }
      return Object.keys(style).length > 0 ? style : undefined;
    },
    sceneUrl(): string | undefined {
      return this.isCorporationCard ? undefined : cardScene(this.card.name, this.tags);
    },
    cardInstance(): ClientCard {
      return getCardOrThrow(this.card.name);
    },
    cardExpansion(): GameModule {
      return this.cardInstance.module;
    },
    cardCompatibility(): Array<GameModule> {
      return this.cardInstance.compatibility;
    },
    isResourceCard(): boolean {
      if (this.cardInstance.resourceType !== undefined) {
        return true;
      } else {
        return false;
      }
    },
    tags(): Array<Tag> {
      const type = this.cardType;
      const tags = [...this.cardInstance.tags || []];
      tags.forEach((tag, idx) => {
        // Clone are changed on card implementations but that's not passed down directly through the
        // model, however, it sends down the `cloneTag` field. So this function does the substitution.
        if (tag === Tag.CLONE && this.card.cloneTag !== undefined) {
          tags[idx] = this.card.cloneTag;
        }
      });
      if (type === CardType.EVENT) {
        tags.push(Tag.EVENT);
      }
      return tags;
    },
    cost(): number | undefined {
      return this.isProjectCard ? this.cardInstance.cost : undefined;
    },
    reducedCost(): number | undefined {
      return this.isProjectCard ? this.card.calculatedCost : undefined;
    },
    cardType(): CardType {
      return this.cardInstance.type;
    },
    cardClasses(): string {
      const classes = [];
      classes.push('card-' + this.card.name.toLowerCase().replaceAll(' ', '-'));
      // Expansion of the card, so themes can mark it (Dune: the prelude mark with 1 or 2)
      classes.push('card-module-' + this.cardExpansion);

      // Used action with the player cube: the card stays in color and fully visible – the cube shows the state like at
      // the table. A grey filter on the card would also grey out the cube (a parent's filter applies to all children).
      // Without a cube (classic UI or no player color) a used action is shown greyed out.
      // Search For Life after a find: greyed with the found microbe on top, the action stays usable (cards.less .card-life-found)
      const unavailable = this.card.isDisabled || this.actionUsed;
      if (this.lifeFound) {
        classes.push('card-life-found');
      } else if (unavailable && !this.showPlayerCube) {
        classes.push('card-unavailable');
      }

      if (this.isStandardProject) {
        classes.push('card-standard-project');
      }
      if (this.scrollSpace !== undefined) {
        classes.push('card-scrolls');
      }
      // Cards no longer grow taller on hover (formerly with experimental_ui) – otherwise the grid jumps
      if (this.autoTall) {
        classes.push('card-auto-tall');
      }
      const learnerModeOff = !getPreferences().learner_mode;
      if (learnerModeOff && this.isStandardProject && this.card.isDisabled) {
        classes.push('card-hide');
      }
      return classes.join(' ');
    },
    cardMetadata(): CardMetadata {
      return this.cardInstance.metadata;
    },
    cardRequirements(): ReadonlyArray<CardRequirementDescriptor> | undefined {
      return this.cardInstance.requirements;
    },
    resourceAmount(): number {
      return this.card.resources || this.robotCard?.resources || 0;
    },
    isCorporationCard() : boolean {
      return this.cardType === CardType.CORPORATION;
    },
    isProjectCard(): boolean {
      const type = this.cardType;
      return type === CardType.AUTOMATED || type === CardType.ACTIVE || type === CardType.EVENT;
    },
    isStandardProject() : boolean {
      return this.cardType === CardType.STANDARD_PROJECT || this.cardType === CardType.STANDARD_ACTION;
    },
    hasResourceType(): boolean {
      return this.card.isSelfReplicatingRobotsCard === true || this.cardInstance.resourceType !== undefined || this.robotCard !== undefined;
    },
    resourceType(): CardResource {
      if (this.robotCard !== undefined || this.card.isSelfReplicatingRobotsCard === true) {
        return CardResource.RESOURCE_CUBE;
      }
      // This last RESOURCE_CUBE is functionally unnecessary and serves to satisfy the type contract.
      return this.cardInstance.resourceType ?? CardResource.RESOURCE_CUBE;
    },
    bottomPadding(): string {
      if (this.cardMetadata.victoryPoints !== undefined) {
        return 'long';
      }
      if (this.hasResourceType) {
        return 'short';
      }
      return '';
    },
    helpText(): string | undefined {
      return this.cardInstance.metadata.helpText;
    },
    lifeFound(): boolean {
      return this.card.foundLifeVariant !== undefined;
    },
    showPlayerCube(): boolean {
      return getPreferences().experimental_ui && this.actionUsed && this.cubeColor !== 'neutral';
    },
  },
});

</script>
