// A card selection that is one of several card sections in its tab (OrOptions.vue "Actions" tab: usable action cards,
// then greyed out the actions already used and those not usable). The selection renders the heading of its own cards
// and the following view-only sections inside its card grid (SelectCard.vue): so the one header row (filter, zoom,
// sorting) stays on top over all sections, and every section uses the same card size and spacing.
import {InjectionKey, ShallowRef} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {Color} from '@/common/Color';

// View-only section after the selectable cards (CardListSection.vue)
export type TrailingCardSection = {
  title: string;
  cards: ReadonlyArray<CardModel>;
  unavailable?: boolean;
  actionUsed?: boolean;
  cubeColor?: Color;
};

export type CardSections = {
  // Heading of the selectable cards; undefined: no heading (the selection is the only section)
  title?: {text: string; count: number};
  trailing: ReadonlyArray<TrailingCardSection>;
};

export type CardSectionsFor = (input: PlayerInputModel) => CardSections | undefined;

export const CARD_SECTIONS: InjectionKey<ShallowRef<CardSectionsFor | undefined>> = Symbol('cardSections');
