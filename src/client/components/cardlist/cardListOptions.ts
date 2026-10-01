import {CardType} from '@/common/cards/CardType';
import {Tag} from '@/common/cards/Tag';
import {GameModule} from '@/common/cards/GameModule';
import {CardResource} from '@/common/CardResource';
import {getEnumStringValues} from '@/common/utils/utils';
import {cardResourceCSS} from '@/client/components/common/cardResources';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS} from '@/client/components/create/createGameChoices';
import {ResourceOption, TagOption, TypeOption} from '@/client/components/cardlist/CardListModel';

// Wählbare Optionen der Filtergruppen als Daten: CardListFilterGroup rendert sie per v-for.

export type FilterOption<K extends string = string> = {
  key: K;
  // Englischer Text, wird beim Anzeigen übersetzt
  label: string;
  // Symbol (Tag, Erweiterung, Ressource) …
  iconClass?: string;
  // … oder Farbpunkt in der Farbe des Kartentyps (cards.less)
  colorClass?: string;
};

// Farbe je Eintragsart: die Titel-Hintergründe der Karten (cards.less), für Meilensteine/Agenden eigene Töne (card_list.less)
export const TYPE_COLOR_CLASSES: Record<TypeOption, string> = {
  [CardType.AUTOMATED]: 'background-color-automated',
  [CardType.ACTIVE]: 'background-color-active',
  [CardType.EVENT]: 'background-color-events',
  [CardType.PRELUDE]: 'background-color-prelude',
  [CardType.CORPORATION]: 'background-color-corporation',
  [CardType.CEO]: 'background-color-ceo',
  [CardType.STANDARD_PROJECT]: 'background-color-standard-project',
  [CardType.STANDARD_ACTION]: 'background-color-standard-project',
  [CardType.PROXY]: 'background-color-standard-project',
  colonyTiles: 'background-color-colony',
  globalEvents: 'background-color-global',
  milestones: 'card-list-color-milestone',
  awards: 'card-list-color-award',
  agendas: 'card-list-color-agenda',
};

// Lesbare Namen statt der internen Schlüssel (z. B. standard_project)
const TYPE_LABELS: Record<TypeOption, string> = {
  [CardType.AUTOMATED]: 'Automated',
  [CardType.ACTIVE]: 'Active',
  [CardType.EVENT]: 'Event',
  [CardType.PRELUDE]: 'Prelude',
  [CardType.CORPORATION]: 'Corporation',
  [CardType.CEO]: 'CEO',
  [CardType.STANDARD_PROJECT]: 'Standard Projects',
  [CardType.STANDARD_ACTION]: 'Standard Actions',
  [CardType.PROXY]: 'Proxy',
  colonyTiles: 'Colony Tiles',
  globalEvents: 'Global Events',
  milestones: 'Milestones',
  awards: 'Awards',
  agendas: 'Agendas',
};

export function typeLabel(type: TypeOption): string {
  return TYPE_LABELS[type];
}

const VISIBLE_TYPES: ReadonlyArray<TypeOption> = [
  CardType.AUTOMATED,
  CardType.ACTIVE,
  CardType.EVENT,
  CardType.PRELUDE,
  CardType.CORPORATION,
  CardType.CEO,
  CardType.STANDARD_PROJECT,
  'colonyTiles',
  'globalEvents',
  'milestones',
  'awards',
  'agendas',
];

export const TYPE_OPTIONS: ReadonlyArray<FilterOption<TypeOption>> = VISIBLE_TYPES.map((type) => ({
  key: type,
  label: typeLabel(type),
  colorClass: TYPE_COLOR_CLASSES[type],
}));

// Das Ereignis-Tag fehlt bewusst: es ist identisch mit dem Kartentyp "Ereignis"
const VISIBLE_TAGS: ReadonlyArray<TagOption> = [
  ...getEnumStringValues(Tag).filter((tag) => tag !== Tag.EVENT) as Array<Tag>,
  'none',
];

export const TAG_OPTIONS: ReadonlyArray<FilterOption<TagOption>> = VISIBLE_TAGS.map((tag) => ({
  key: tag,
  label: tag === 'none' ? 'No tags' : tag,
  iconClass: `card-tag tag-${tag}`,
}));

export const EXPANSION_OPTIONS: ReadonlyArray<FilterOption<GameModule>> = [
  {key: 'base', label: 'Base', iconClass: 'expansion-icon expansion-icon-base'},
  ...[...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS].map((choice) => ({
    key: choice.expansion,
    label: choice.label,
    iconClass: `expansion-icon ${choice.iconClass}`,
  })),
];

const VISIBLE_RESOURCES: ReadonlyArray<ResourceOption> = [...getEnumStringValues(CardResource), 'none'];

export const RESOURCE_OPTIONS: ReadonlyArray<FilterOption<ResourceOption>> = VISIBLE_RESOURCES.map((resource) => ({
  key: resource,
  label: resource === 'none' ? 'No resources' : resource,
  iconClass: resource === 'none' ? 'card-tag tag-none' : `card-resource ${cardResourceCSS[resource]}`,
}));

// Teil eines Abschnitts (CardListSection): ein Kartentyp mit Farbe und Anzahl
export type SectionPart = {
  label: string;
  colorClass: string;
  count: number;
};

export function optionKeys<K extends string>(options: ReadonlyArray<FilterOption<K>>): Array<K> {
  return options.map((option) => option.key);
}
