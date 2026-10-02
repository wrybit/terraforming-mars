<template>
  <!-- Hilfe (Fork): feste Kopfzeile mit Suche und Tabs, links ein Seitenbaum, rechts der scrollende Inhalt.
       Im Spiel steckt sie in SidebarModal (closable), unter /help steht sie als eigene Seite. -->
  <div class="help-overlay" :class="{'help-overlay--page': !closable}">
    <header class="help-overlay-head">
      <div class="help-overlay-toprow">
        <h1 class="help-overlay-title" v-i18n>Help</h1>
        <label class="help-overlay-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3.5-3.5"/>
          </svg>
          <input v-model="query" type="search" autocomplete="off" :placeholder="$t('Search in this tab')" :aria-label="$t('Search in this tab')">
        </label>
        <button v-if="closable" type="button" class="help-overlay-close" :aria-label="$t('Close')" @click="emit('close')">✕</button>
      </div>
      <nav class="help-overlay-tabs" role="tablist">
        <button
          v-for="tab in HELP_OVERLAY_TABS"
          :key="tab.key"
          type="button"
          role="tab"
          class="help-overlay-tab"
          :class="{'help-overlay-tab--desktop-only': tab.desktopOnly}"
          :aria-selected="tab.key === currentKey"
          @click="currentKey = tab.key"
          v-i18n
        >{{ tab.label }}</button>
      </nav>
    </header>

    <div class="help-overlay-main">
      <nav ref="outlineNav" class="help-overlay-outline">
        <HelpOutlineNav :nodes="outline" :active-id="activeId" @select="scrollToSection"/>
      </nav>
      <div ref="content" class="help-overlay-content" @scroll.passive="scheduleActiveUpdate">
        <component :is="currentTab.component" :key="currentTab.key"/>
        <div v-if="noMatches" class="help-overlay-empty" v-i18n>Nothing found</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {HelpTabKey} from '@/client/components/helpOverlay/helpOverlayTabs';

// Zuletzt gewählter Tab gilt für die ganze Sitzung, auch wenn das Overlay zwischendurch geschlossen wird
let lastTabKey: HelpTabKey = 'iconology';
</script>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import HelpOutlineNav from '@/client/components/helpOverlay/HelpOutlineNav.vue';
import {HELP_OVERLAY_TABS, isHelpTabKey} from '@/client/components/helpOverlay/helpOverlayTabs';
import {HelpOutlineNode, outlineIds, toOutlineNodes} from '@/client/components/helpOverlay/helpOutline';
import {applyHelpSearch} from '@/client/components/helpOverlay/helpSearch';

const props = defineProps<{
  // Im Spiel als Overlay mit Schließen-Button; ohne ist es die Seite /help
  closable?: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

// Ab dieser Höhe über dem Inhalt gilt ein Abschnitt als "aktuell" (Kopfabstand der Abschnitte)
const ACTIVE_THRESHOLD_PX = 32;

function initialTabKey(): HelpTabKey {
  if (!props.closable) {
    const hash = window.location.hash.replace('#', '');
    if (isHelpTabKey(hash)) {
      return hash;
    }
  }
  return lastTabKey;
}

const currentKey = ref<HelpTabKey>(initialTabKey());
const currentTab = computed(() => HELP_OVERLAY_TABS.find((tab) => tab.key === currentKey.value) ?? HELP_OVERLAY_TABS[0]);
const query = ref('');
const outline = ref<Array<HelpOutlineNode>>([]);
const activeId = ref<string | undefined>(undefined);
const noMatches = ref(false);
const content = ref<HTMLElement>();
const outlineNav = ref<HTMLElement>();
let sections: Array<HTMLElement> = [];
let frameRequested = false;

// Seitenbaum aus dem frisch gerenderten Tab lesen
async function refreshOutline(): Promise<void> {
  await nextTick();
  const root = content.value;
  if (root === undefined) {
    return;
  }
  outline.value = toOutlineNodes(currentTab.value.outline(root));
  sections = outlineIds(outline.value)
    .map((id) => root.querySelector<HTMLElement>(`[id="${id}"]`))
    .filter((element): element is HTMLElement => element !== null);
  updateActiveSection();
}

// Aktiv ist der tiefste Abschnitt, dessen Anfang schon oben angekommen ist; ganz unten der letzte sichtbare
function updateActiveSection(): void {
  const root = content.value;
  const visible = sections.filter((element) => element.offsetParent !== null);
  if (root === undefined || visible.length === 0) {
    activeId.value = undefined;
    return;
  }
  const top = root.getBoundingClientRect().top + ACTIVE_THRESHOLD_PX;
  // Nur wenn überhaupt gescrollt werden kann – sonst wäre bei kurzen Tabs gleich der letzte Abschnitt aktiv
  const scrollable = root.scrollHeight > root.clientHeight + 2;
  const atBottom = scrollable && root.scrollTop + root.clientHeight >= root.scrollHeight - 2;
  let active = visible[0];
  for (const element of visible) {
    const elementTop = element.getBoundingClientRect().top;
    if (elementTop <= top || (atBottom && elementTop < root.getBoundingClientRect().bottom)) {
      active = element;
    }
  }
  activeId.value = active.id;
}

function scheduleActiveUpdate(): void {
  if (frameRequested) {
    return;
  }
  frameRequested = true;
  requestAnimationFrame(() => {
    frameRequested = false;
    updateActiveSection();
  });
}

function scrollToSection(id: string): void {
  const target = content.value?.querySelector<HTMLElement>(`[id="${id}"]`);
  target?.scrollIntoView({behavior: 'smooth', block: 'start'});
  activeId.value = id;
}

// Am Handy ist der Baum eine waagerechte Chip-Leiste: aktiven Chip im Blick halten
watch(activeId, (id) => {
  const nav = outlineNav.value;
  const link = nav?.querySelector<HTMLElement>(`[data-outline-id="${id}"]`);
  if (nav === undefined || link === null || link === undefined || nav.scrollWidth <= nav.clientWidth) {
    return;
  }
  const navBox = nav.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  if (linkBox.left < navBox.left || linkBox.right > navBox.right) {
    nav.scrollTo({left: nav.scrollLeft + linkBox.left - navBox.left - 12, behavior: 'smooth'});
  }
});

watch(currentKey, (key) => {
  lastTabKey = key;
  query.value = '';
  noMatches.value = false;
  if (!props.closable) {
    window.location.hash = key;
  }
  if (content.value !== undefined) {
    content.value.scrollTop = 0;
  }
  void refreshOutline();
});

watch(query, (value) => {
  const root = content.value;
  if (root === undefined) {
    return;
  }
  const matches = applyHelpSearch(root, currentTab.value.search, value);
  noMatches.value = value.trim() !== '' && matches === 0;
  root.scrollTop = 0;
  void nextTick(updateActiveSection);
});

onMounted(() => {
  window.addEventListener('resize', scheduleActiveUpdate);
  void refreshOutline();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleActiveUpdate);
});
</script>
