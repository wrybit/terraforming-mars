import {Message} from '@/common/logs/Message';
import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {resourceSnapshot, titleText} from '@/client/components/selectPlayerResource';

// One side of an amount conversion: what changes, where (stock, production or resources on the triggering card)
// and by how much per step of the slider
export type AmountSide =
  | {kind: 'stock' | 'production', resource: Resource, perStep: number}
  | {kind: 'card', resource: CardResource, perStep: number};

// What one slider step converts: source (loses) and target (gains)
export type AmountConversion = {
  from: AmountSide,
  to: AmountSide,
};

type ConversionRule = {
  // English title key of the server's SelectAmount
  title: string,
  // Only for this card (the same title is used by several cards with different targets)
  card?: CardName,
  conversion: AmountConversion,
};

const stock = (resource: Resource, perStep = 1): AmountSide => ({kind: 'stock', resource, perStep});
const production = (resource: Resource, perStep = 1): AmountSide => ({kind: 'production', resource, perStep});
const onCard = (resource: CardResource, perStep = 1): AmountSide => ({kind: 'card', resource, perStep});

// Known conversions; the server only sends title, min and max, so source, target and rate come from here.
// Unknown amount inputs (e.g. inside AndOptions) show the slider alone.
const RULES: ReadonlyArray<ConversionRule> = [
  {title: 'Select amount of heat production to decrease', card: CardName.INSULATION,
    conversion: {from: production(Resource.HEAT), to: production(Resource.MEGACREDITS)}},
  {title: 'Select amount of energy to spend', card: CardName.POWER_INFRASTRUCTURE,
    conversion: {from: stock(Resource.ENERGY), to: stock(Resource.MEGACREDITS)}},
  {title: 'Remove any number of microbes to gain 3 M€ per microbe removed',
    conversion: {from: onCard(CardResource.MICROBE), to: stock(Resource.MEGACREDITS, 3)}},
  {title: 'Remove X floaters on this card to gain X titanium',
    conversion: {from: onCard(CardResource.FLOATER), to: stock(Resource.TITANIUM)}},
  {title: 'Select amount of energy to gain',
    conversion: {from: stock(Resource.MEGACREDITS, 2), to: stock(Resource.ENERGY)}},
  {title: 'Select amount of energy to convert to heat',
    conversion: {from: stock(Resource.ENERGY), to: stock(Resource.HEAT)}},
  {title: 'Select up to ${0} steel to convert to titanium',
    conversion: {from: stock(Resource.STEEL), to: stock(Resource.TITANIUM)}},
];

export function amountConversion(title: string | Message, sourceCard: CardName | undefined): AmountConversion | undefined {
  const key = titleText(title);
  return RULES.find((rule) => rule.title === key && (rule.card === undefined || rule.card === sourceCard))?.conversion;
}

// Current value of a side for the player: stock or production, or resources on the triggering card
export function amountSideValue(side: AmountSide, player: PublicPlayerModel, sourceCard: CardName | undefined): number {
  if (side.kind === 'card') {
    return player.tableau.find((card) => card.name === sourceCard)?.resources ?? 0;
  }
  const snapshot = resourceSnapshot(player, side.resource);
  return side.kind === 'production' ? snapshot.production : snapshot.stock;
}
