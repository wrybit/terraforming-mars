import {Resource} from '@/common/Resource';
import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {duneGraphic} from './duneGraphic';

// Shared by the panes of the CHOAM tab (ChoamExchangeInput.vue): pictures and names of the resources in the Dune
// theme, and how a move of the server's choice is found by its title.

const RESOURCE_GRAPHIC: Readonly<Record<Resource, string>> = {
  megacredits: 'coin',
  steel: 'res-plasteel',
  titanium: 'res-spice',
  plants: 'res-plant',
  energy: 'res-moisture',
  heat: 'res-water',
};

/** English names, translated on display (the Dune theme turns them into its own words) */
export const RESOURCE_LABEL: Readonly<Record<Resource, string>> = {
  megacredits: 'M€',
  steel: 'Steel',
  titanium: 'Titanium',
  plants: 'Plants',
  energy: 'Energy',
  heat: 'Heat',
};

export function resourceGraphic(resource: Resource): string {
  return duneGraphic(RESOURCE_GRAPHIC[resource]);
}

/** English title key of a choice (its message, when the title carries values) */
export function titleKey(input: PlayerInputModel): string {
  const title = input.title as string | Message;
  return typeof title === 'string' ? title : title.message;
}

/** Index of the choice with this title (and, when given, this first value); -1 when the server does not offer it now */
export function choiceIndex(options: ReadonlyArray<PlayerInputModel>, title: string, value?: number): number {
  return options.findIndex((option) => {
    if (titleKey(option) !== title) {
      return false;
    }
    if (value === undefined) {
      return true;
    }
    const message = option.title as string | Message;
    return typeof message !== 'string' && Number(message.data[0]?.value) === value;
  });
}
