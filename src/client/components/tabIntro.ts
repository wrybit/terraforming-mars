import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {MAX_OCEAN_TILES, MAX_TEMPERATURE} from '@/common/constants';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {TileType} from '@/common/TileType';
import {PreviewTile, previewTileForSpaceInput} from '@/client/components/spaceTilePreview';
import {specialTileImage, TileImage, tileImage} from '@/client/components/specialTileImage';

// Explanation at the top of an action tab's box (OrOptions), where otherwise there would only be a button:
// image (tile or resource), what happens and hint lines.
export type TabIntro = {
  tile?: TileImage; // Tile (hexagon, with an icon on it for special tiles)
  resourceIcon?: string; // Resource icon (resources.less: resource_icon--<name>)
  hint?: 'click-space';
  facts?: ReadonlyArray<IntroFact>; // Game-state lines so the consequences of the action are visible without searching
  finale?: true; // Last step of the game (final greenery): golden "Mars is terraformed" above the title
};

// One game-state line below the explanation; values come from the game state only when displayed (introFacts)
export type IntroFact =
  {kind: 'temperature'} |
  {kind: 'heat', cost: number} |
  {kind: 'oceans'} |
  {kind: 'finalGreenery'} |
  {kind: 'plants'};

// Input that wraps the final greenery placement (Player.takeActionForFinalGreenery)
const FINAL_GREENERY = 'Place any final greenery from plants';

function heatConversion(cost: number): TabIntro {
  return {resourceIcon: 'heat', facts: [{kind: 'temperature'}, {kind: 'heat', cost}]};
}

const INTROS: Readonly<Record<string, TabIntro>> = {
  'Convert ${0} plants into greenery': {tile: tileImage(TileType.GREENERY), hint: 'click-space'},
  'Convert 8 heat into temperature': heatConversion(8),
  'Convert 6 heat into temperature': heatConversion(6),
};

// One temperature step is 2 °C (board scale)
const TEMPERATURE_STEP = 2;

// context: the input around the option (e.g. the final greenery around its space selection)
export function tabIntro(option: PlayerInputModel, context?: PlayerInputModel): TabIntro | undefined {
  const intro = optionIntro(option);
  if (intro !== undefined && context !== undefined && titleKey(context.title) === FINAL_GREENERY) {
    return {...intro, finale: true, facts: [{kind: 'finalGreenery'}, {kind: 'plants'}, ...(intro.facts ?? [])]};
  }
  return intro;
}

function titleKey(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

function optionIntro(option: PlayerInputModel): TabIntro | undefined {
  const key = titleKey(option.title);
  const intro = INTROS[key];
  if (intro !== undefined) {
    return intro;
  }
  // Every space selection gets the click hint, plus the tile: the card's special tile or volcano,
  // otherwise ocean/city/greenery like the preview on the board (spaceTilePreview.ts)
  if (option.type !== 'space') {
    return undefined;
  }
  const tile = specialTileImage(option.title) ?? plainTile(option.title);
  // For oceans what counts is how many are already placed (limit, ocean bonus on adjacent spaces)
  if (previewTileForSpaceInput(option.title) === 'ocean') {
    return {tile, hint: 'click-space', facts: [{kind: 'oceans'}]};
  }
  return {tile, hint: 'click-space'};
}

const PREVIEW_TILES: Readonly<Record<PreviewTile, TileType>> = {
  greenery: TileType.GREENERY,
  city: TileType.CITY,
  ocean: TileType.OCEAN,
};

function plainTile(title: string | Message): TileImage | undefined {
  const preview = previewTileForSpaceInput(title);
  return preview === undefined ? undefined : tileImage(PREVIEW_TILES[preview]);
}

function rawValues(...values: ReadonlyArray<number>): Message['data'] {
  return values.map((value) => ({type: LogMessageDataType.RAW_STRING, value: String(value)}));
}

// Text lines for the game-state lines of an explanation
export function introFacts(intro: TabIntro, playerView: PlayerViewModel): Array<string | Message> {
  return (intro.facts ?? []).map((fact) => {
    switch (fact.kind) {
    case 'temperature':
      return temperatureHint(playerView.game.temperature);
    case 'heat': {
      const heat = playerView.thisPlayer.heat;
      return {message: 'Heat drops from ${0} to ${1}', data: rawValues(heat, Math.max(heat - fact.cost, 0))};
    }
    case 'finalGreenery':
      return 'Last chance: turn your remaining plants into greeneries – each one is worth 1 victory point.';
    case 'plants':
      return {message: 'You have ${0} plants', data: rawValues(playerView.thisPlayer.plants)};
    case 'oceans':
      return {message: '${0} of ${1} oceans are already on Mars', data: rawValues(playerView.game.oceans, MAX_OCEAN_TILES)};
    }
  });
}

// "Temperature rises from -28 °C to -26 °C" or a hint that it is already at the maximum
function temperatureHint(currentTemperature: number): string | Message {
  if (currentTemperature >= MAX_TEMPERATURE) {
    return 'Temperature is already at maximum';
  }
  const next = Math.min(currentTemperature + TEMPERATURE_STEP, MAX_TEMPERATURE);
  return {
    message: 'Temperature rises from ${0} °C to ${1} °C',
    data: rawValues(currentTemperature, next),
  };
}
