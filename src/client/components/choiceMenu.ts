import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {isEndTab} from '@/client/components/orOptionsShortLabels';
import {inputSourceCard} from '@/client/components/inputSourceCard';

// Simple decision (e.g. Olympus Conference: "add resource" or "remove"): only plain options
// without their own input, plus at most one player selection (e.g. Comet for Venus: "select player" or "remove no M€").
// It goes into a single tab (WaitingForTabs) with choice tiles (OrOptions) – each player and each
// option one tile –, not its own tab bar like the action menu. Pass/end always belong to the action menu.
// Inputs that fit below the tiles of a card decision: card selection (Local Heat Trapping, Mars University),
// amount (Sulphur-Eating Bacteria, Titan Shuttles), resource type (Clone Troopers). Space selections and
// payments keep their tabs – they need the board or the payment footer.
export const INLINE_INPUT_TYPES: ReadonlyArray<PlayerInputModel['type']> = ['card', 'amount', 'resource'];

// A card's decision (sourceCard set, e.g. Imported Hydrogen: "Gain 3 plants" / "Add 3 microbes to …" /
// "Add 2 animals to a card") may also contain card selections: they become tiles too, the card selection
// appears below the tiles once its tile is chosen – no tab bar for a card's options.
export function isChoiceMenu(input: PlayerInputModel): input is OrOptionsModel {
  const fromCard = inputSourceCard(input) !== undefined;
  return input.type === 'or' &&
    input.options.length > 0 &&
    input.options.filter((option) => option.type === 'player').length <= 1 &&
    input.options.every((option) =>
      (option.type === 'option' && !isEndTab(option.title)) ||
      option.type === 'player' ||
      (fromCard && INLINE_INPUT_TYPES.includes(option.type)));
}

// Input that represents a decision outwardly (question, tab label, color in WaitingForTabs):
// the player selection if there is one – its title says what it is about –, otherwise the decision itself
export function choiceMenuLead(input: PlayerInputModel): PlayerInputModel {
  if (!isChoiceMenu(input)) {
    return input;
  }
  return input.options.find((option) => option.type === 'player') ?? input;
}
