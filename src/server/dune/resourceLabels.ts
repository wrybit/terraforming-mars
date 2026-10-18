import {Resource} from '../../common/Resource';

// Names of the resources in the choices of the Dune expansion (English, translated on display; the Dune theme
// turns them into its own words: heat → water, titanium → spice …)
export const RESOURCE_LABEL: Record<Resource, string> = {
  megacredits: 'M€',
  steel: 'steel',
  titanium: 'titanium',
  plants: 'plants',
  energy: 'energy',
  heat: 'heat',
};
