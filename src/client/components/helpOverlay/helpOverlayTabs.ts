/*
 * Tabs des Hilfe-Overlays (Fork): Inhalt kommt aus den unveränderten Upstream-Komponenten,
 * Seitenbaum und Suche werden je Tab aus deren gerendertem Markup gelesen.
 */
import {Component} from 'vue';
import HelpIconology from '@/client/components/help/HelpIconology.vue';
import HelpPhases from '@/client/components/help/HelpPhases.vue';
import HelpRulebooks from '@/client/components/help/HelpRulebooks.vue';
import HelpSoloRules from '@/client/components/help/HelpSoloRules.vue';
import HelpStandardProjects from '@/client/components/help/HelpStandardProjects.vue';
import HelpTurmoilParties from '@/client/components/help/HelpTurmoilParties.vue';
import HelpKeyboardShortcuts from '@/client/components/helpOverlay/HelpKeyboardShortcuts.vue';
import {HelpOutlineEntry, plainText} from '@/client/components/helpOverlay/helpOutline';
import {HelpSearchConfig} from '@/client/components/helpOverlay/helpSearch';

// Gleiche Schlüssel wie die Upstream-Hilfeseite, damit Links wie /help#rulebooks weiter funktionieren
export const HELP_TAB_KEYS = ['iconology', 'standard-projects', 'phases', 'turmoil-parties', 'solo-rules', 'rulebooks', 'hotkeys'] as const;
export type HelpTabKey = typeof HELP_TAB_KEYS[number];

export type HelpOverlayTab = {
  key: HelpTabKey;
  // Englischer Schlüssel für v-i18n (Upstream-Texte, schon übersetzt)
  label: string;
  component: Component;
  // Nur mit Tastatur sinnvoll – auf Touch-Geräten ausgeblendet
  desktopOnly?: boolean;
  outline: (root: HTMLElement) => Array<HelpOutlineEntry>;
  search: HelpSearchConfig;
};

function all(root: Element, selector: string): Array<HTMLElement> {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

function childrenByTag(element: Element, tagName: string): Array<HTMLElement> {
  return Array.from(element.children).filter((child): child is HTMLElement => child.tagName === tagName);
}

// Symbolzeilen erkennt man am Namensfeld; Überschriften-Hüllen haben keins
function iconologyRows(root: HTMLElement): Array<Element> {
  return all(root, '.help-icon-label').map((label) => label.parentElement).filter((row): row is HTMLElement => row !== null);
}

// Parteinamen stehen im Spiel in Großbuchstaben; im Seitenbaum lesen sie sich normal geschrieben besser
function capitalizeWords(text: string): string {
  return text.toLocaleLowerCase().replace(/(^|\s)(\S)/g, (_match, space: string, letter: string) => space + letter.toLocaleUpperCase());
}

// Phasen: Listenpunkt mit eigenem Label = Abschnitt; "i. …" bis "iv. …" der Solar-Phase = Unterschritt
const ROMAN_STEP = /^[ivx]+\./i;

function phaseEntry(item: HTMLElement): HelpOutlineEntry | undefined {
  const label = childrenByTag(item, 'LABEL')[0];
  if (label !== undefined) {
    const list = childrenByTag(item, 'UL')[0];
    const children = list === undefined ? [] : childrenByTag(list, 'LI').map(phaseEntry).filter((entry): entry is HelpOutlineEntry => entry !== undefined);
    return {element: item, label: plainText(label), children};
  }
  const first = item.firstElementChild;
  if (first?.tagName === 'SPAN' && ROMAN_STEP.test(plainText(first))) {
    return {element: item, label: plainText(first)};
  }
  return undefined;
}

export const HELP_OVERLAY_TABS: ReadonlyArray<HelpOverlayTab> = [
  {
    key: 'iconology',
    label: 'Game Iconology',
    component: HelpIconology,
    outline: (root) => all(root, '.help-icons-column').map((column) => ({
      element: column,
      label: plainText(column.querySelector('.help-icons-section-heading')),
      children: all(column, '.help-icon-sublabel').map((sublabel) => ({element: sublabel.parentElement ?? sublabel, label: plainText(sublabel)})),
    })),
    search: {
      items: iconologyRows,
      headings: (root) => all(root, '.help-icon-sublabel').map((sublabel) => sublabel.parentElement ?? sublabel),
      scopes: (root) => all(root, '.help-icons-column'),
    },
  },
  {
    key: 'standard-projects',
    label: 'Standard Projects',
    component: HelpStandardProjects,
    outline: (root) => all(root, '.help-standard-projects-container > h2').map((heading) => ({element: heading, label: plainText(heading)})),
    search: {
      items: (root) => all(root, '.cardbox'),
      headings: (root) => all(root, '.help-standard-projects-container > h2'),
    },
  },
  {
    key: 'phases',
    label: 'Game Phases',
    component: HelpPhases,
    outline: (root) => all(root, '.help-phases-container > ul > li').map(phaseEntry).filter((entry): entry is HelpOutlineEntry => entry !== undefined),
    search: {
      // Einträge sind die innersten Listenpunkte; alles mit Unterliste ist eine Gruppe
      items: (root) => all(root, '.help-phases-container li').filter((item) => item.querySelector('ul') === null),
      scopes: (root) => all(root, '.help-phases-container li').filter((item) => item.querySelector('ul') !== null),
    },
  },
  {
    key: 'turmoil-parties',
    label: 'Political Parties',
    component: HelpTurmoilParties,
    outline: (root) => all(root, '.help-party-card').map((card) => ({element: card, label: capitalizeWords(plainText(card.querySelector('.party-name')))})),
    search: {
      items: (root) => all(root, '.help-agenda-card'),
      scopes: (root) => all(root, '.help-party-card'),
    },
  },
  {
    key: 'solo-rules',
    label: 'Solo Rules',
    component: HelpSoloRules,
    outline: (root) => all(root, '.help-solo-rules-container > .help-icons-section-heading').map((heading) => ({element: heading, label: plainText(heading)})),
    search: {
      items: (root) => all(root, '.help-solo-rules-container > p, .help-solo-rules-container > ul > li'),
      headings: (root) => all(root, '.help-solo-rules-container > .help-icons-section-heading'),
    },
  },
  {
    key: 'rulebooks',
    label: 'Rules',
    component: HelpRulebooks,
    outline: (root) => all(root, '.help-rulebooks-section').map((section) => ({element: section, label: plainText(section.querySelector('.help-icons-section-heading'))})),
    search: {
      items: (root) => all(root, '.help-rulebook-row'),
      scopes: (root) => all(root, '.help-rulebooks-section'),
    },
  },
  {
    key: 'hotkeys',
    label: 'Hot Keys',
    component: HelpKeyboardShortcuts,
    desktopOnly: true,
    outline: (root) => all(root, '.help-overlay-section').map((section) => ({element: section, label: plainText(section.querySelector('.help-overlay-section-title'))})),
    search: {
      items: (root) => all(root, '.help-shortcut'),
      scopes: (root) => all(root, '.help-overlay-section'),
    },
  },
];

export function isHelpTabKey(value: string): value is HelpTabKey {
  return (HELP_TAB_KEYS as ReadonlyArray<string>).includes(value);
}
