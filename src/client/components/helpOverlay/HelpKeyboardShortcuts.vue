<template>
  <!-- Keyboard shortcuts (fork): replaces the old images of the upstream help with keys in app style
       and per shortcut a small sketch of the game view with the target area highlighted -->
  <div class="help-shortcuts">
    <section class="help-overlay-section">
      <h2 class="help-overlay-section-title" v-i18n>Switch view</h2>
      <p class="help-overlay-section-lead" v-i18n>Jumps straight to that area of the game view</p>
      <div class="help-keyrow" aria-hidden="true">
        <span v-for="key in HOME_ROW" :key="key" class="help-key" :class="{'help-key--hot': isShortcutKey(key)}">{{ key }}</span>
      </div>
      <div class="help-shortcut-grid">
        <div v-for="shortcut in SHORTCUTS" :key="shortcut.key" class="help-shortcut">
          <svg class="help-sketch" viewBox="0 0 160 100" aria-hidden="true">
            <rect class="help-sketch-frame" x="0.5" y="0.5" width="159" height="99" rx="6"/>
            <rect class="help-sketch-area" :class="{'help-sketch-area--target': shortcut.target === 'players'}" x="8" y="8" width="84" height="26" rx="3"/>
            <rect class="help-sketch-area" :class="{'help-sketch-area--target': shortcut.target === 'hand'}" x="8" y="40" width="84" height="52" rx="3"/>
            <circle class="help-sketch-area" :class="{'help-sketch-area--target': shortcut.target === 'board'}" cx="126" cy="38" r="26"/>
            <rect class="help-sketch-area" :class="{'help-sketch-area--target': shortcut.target === 'colonies'}" x="100" y="72" width="52" height="20" rx="3"/>
          </svg>
          <div class="help-shortcut-text">
            <span class="help-key help-key--hot">{{ shortcut.key }}</span>
            <span v-i18n>{{ shortcut.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="help-overlay-section">
      <h2 class="help-overlay-section-title" v-i18n>Windows</h2>
      <div class="help-shortcut-grid">
        <div class="help-shortcut help-shortcut-text">
          <span class="help-key help-key--hot help-key--wide">Esc</span>
          <span v-i18n>Close help and other windows</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Target areas of the sketch; order and keys as in KeyboardShortcuts.vue
type SketchTarget = 'board' | 'players' | 'hand' | 'colonies';
type Shortcut = {key: string; label: string; target: SketchTarget};

const SHORTCUTS: ReadonlyArray<Shortcut> = [
  {key: 'A', label: 'Main Board', target: 'board'},
  {key: 'S', label: 'Players Overview Table', target: 'players'},
  {key: 'D', label: 'Cards in Hand', target: 'hand'},
  {key: 'F', label: 'Colonies', target: 'colonies'},
];

// Home row of the keyboard, so you find the shortcuts under your fingers at a glance
const HOME_ROW: ReadonlyArray<string> = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];

function isShortcutKey(key: string): boolean {
  return SHORTCUTS.some((shortcut) => shortcut.key === key);
}
</script>
