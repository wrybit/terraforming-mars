import {CardName} from '@/common/cards/CardName';

// Interface through which every stats building block opens the large card view (StatsPage provides it)
export type StatsCardZoomRequest = {
  names: ReadonlyArray<CardName>;
  index: number;
  origin?: DOMRect;
};

export type OpenCardZoom = (request: StatsCardZoomRequest) => void;

export const CARD_ZOOM_KEY = 'statsOpenCardZoom';
