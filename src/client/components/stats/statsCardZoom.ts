import {CardName} from '@/common/cards/CardName';

// Schnittstelle, über die jeder Baustein der Statistik die Kartengroßansicht öffnet (StatsPage stellt sie bereit)
export type StatsCardZoomRequest = {
  names: ReadonlyArray<CardName>;
  index: number;
  origin?: DOMRect;
};

export type OpenCardZoom = (request: StatsCardZoomRequest) => void;

export const CARD_ZOOM_KEY = 'statsOpenCardZoom';
