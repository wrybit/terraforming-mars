<!-- Handy quer: zu wenig Höhe für Spielplan und Fußleiste. Statt einer gequetschten Ansicht die Bitte,
     das Gerät hochkant zu drehen. Sichtbar schaltet allein rotate_hint.less (Touch, quer, flach). -->
<template>
  <div class="rotate-hint" role="alert">
    <svg class="rotate-hint__icon" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="22" y="6" width="20" height="36" rx="4"/>
      <path d="M30 36h4"/>
      <path d="M12 50a22 22 0 0 0 40 0"/>
      <path d="M48 44l4 6 6-3"/>
    </svg>
    <p class="rotate-hint__text" v-i18n>Please turn your phone upright</p>
  </div>
</template>

<script setup lang="ts">
</script>
